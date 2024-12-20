const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");
// Caminho para o diretório de stickers
const stickersDir = path.resolve(__dirname, "./stickers");
const MAX_STATIC_SIZE = 64 * 1024;
// Verificando se o diretório existe ou se será criado
if (!fs.existsSync(stickersDir)) {
  console.log("Diretório de stickers não encontrado. Criando...");
  fs.mkdirSync(stickersDir, { recursive: true });
  console.log("Diretório de stickers criado com sucesso!");
}
async function createStaticSticker(inputPath, outputPath) {
  try {
    console.log(`Criando figurinha estática a partir de: ${inputPath}`);
    console.log(`Caminho da figurinha de saída: ${outputPath}`);
    await sharp(inputPath)
      .resize(512, 512) // Redimensiona para 512x512
      .webp({ quality: 50 }) // Define qualidade para 50%
      .toFile(outputPath);
    let stickerSize = fs.statSync(outputPath).size;
    console.log(`Tamanho da figurinha estática: ${stickerSize} bytes`);
    let attempts = 0;
    while (stickerSize > MAX_STATIC_SIZE && attempts < 5) {
      console.log(
        "A figurinha estática está muito grande, compactando mais..."
      );
      attempts++;
      await sharp(inputPath)
        .resize(512, 512) // Reduz para 512x512
        .webp({ quality: 30 }) // Reduz qualidade para 30%
        .toFile(outputPath);
      stickerSize = fs.statSync(outputPath).size;
      console.log(
        `Tamanho após compressão agressiva (tentativa ${attempts}): ${stickerSize} bytes`
      );
    }
    console.log("Sticker estático criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar figurinha estática:", error);
  }
}
async function createAnimatedSticker(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Criando figurinha animada...`);
    ffmpeg(inputPath)
      .outputOptions([
        "-vcodec libwebp",
        "-vf scale=512:512:force_original_aspect_ratio=increase,crop=512:512,setsar=1",
        "-loop 0",
        "-preset default",
        "-an",
        "-vsync 0",
        "-s 512x512",
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}
async function createStickerCommand(msg, sock) {
  try {
    const message = msg.message;
    let mediaFile;
    let mediaFilePath;
    let mediaExtension;
    // Verifica se a mensagem contém um vídeo
    if (message && message.videoMessage) {
      console.log("Mensagem com 'videoMessage' encontrada.");
      const videoMessage = message.videoMessage;
      if (videoMessage.url) {
        mediaFilePath = path.resolve(stickersDir, "input.mp4"); // Caminho absoluto para o vídeo
        mediaFile = await downloadMediaMessage(msg, {
          logger: console,
          decrypt: true,
        });
        if (!mediaFile) {
          console.error("Falha ao baixar o vídeo.");
          await sock.sendMessage(msg.key.remoteJid, {
            text: "Erro ao baixar o vídeo. Tente novamente.",
          });
          return;
        }
        // Converte o stream para Buffer e salva o vídeo no caminho especificado
        console.log(`Salvando o vídeo no caminho: ${mediaFilePath}`);
        const buffer = await streamToBuffer(mediaFile);
        fs.writeFileSync(mediaFilePath, buffer);
        console.log(`Arquivo salvo com sucesso no caminho: ${mediaFilePath}`);
        console.log("Vídeo baixado com sucesso!");
      }
    }
    // Verifica se a mensagem contém uma imagem
    else if (message && message.imageMessage) {
      console.log("Mensagem com 'imageMessage' encontrada.");
      const imageMessage = message.imageMessage;
      if (imageMessage.url) {
        mediaFilePath = path.resolve(stickersDir, "input.png"); // Caminho absoluto para a imagem
        mediaFile = await downloadMediaMessage(msg, {
          logger: console,
          decrypt: true,
        });
        if (!mediaFile) {
          console.error("Falha ao baixar a imagem.");
          await sock.sendMessage(msg.key.remoteJid, {
            text: "Erro ao baixar a imagem. Tente novamente.",
          });
          return;
        }
        // Converte o stream para Buffer e salva a imagem no caminho especificado
        console.log(`Salvando a imagem no caminho: ${mediaFilePath}`);
        const buffer = await streamToBuffer(mediaFile);
        fs.writeFileSync(mediaFilePath, buffer);
        console.log(`Arquivo salvo com sucesso no caminho: ${mediaFilePath}`);
        console.log("Imagem baixada com sucesso!");
      }
    } else {
      console.error("Nenhuma mídia válida encontrada.");
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Por favor, envie uma imagem ou vídeo.",
      });
      return;
    }
    // Verificação do caminho completo
    console.log("Caminho completo do arquivo:", mediaFilePath);
    // Verificar se o arquivo foi salvo corretamente
    mediaExtension = path.extname(mediaFilePath).toLowerCase();
    console.log("Extensão da mídia:", mediaExtension); // Ex: .png
    if (!fs.existsSync(mediaFilePath)) {
      console.error(
        `Arquivo de mídia não encontrado no caminho: ${mediaFilePath}`
      );
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Erro ao salvar ou processar a mídia. Tente novamente.",
      });
      return;
    } else {
      console.log(`Arquivo de mídia encontrado: ${mediaFilePath}`);
    }
    // Se for um vídeo, cria uma figurinha animada
    if (message.videoMessage) {
      console.log("Criando figurinha animada...");
      const stickerPath = path.resolve(stickersDir, "sticker.webp");
      await createAnimatedSticker(mediaFilePath, stickerPath);
      if (!fs.existsSync(stickerPath)) {
        console.error(`A figurinha animada não foi criada: ${stickerPath}`);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "Erro ao criar figurinha animada. Tente novamente.",
        });
        return;
      }
      const stickerBuffer = fs.readFileSync(stickerPath);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBuffer,
        gifPlayback: true,
      });
      console.log("Figurinha animada enviada com sucesso!");
    }
    // Se for uma imagem, cria uma figurinha estática
    else {
      console.log("Criando figurinha estática...");
      const outputStickerPath = path.resolve(stickersDir, "sticker.webp");
      await createStaticSticker(mediaFilePath, outputStickerPath);
      if (!fs.existsSync(outputStickerPath)) {
        console.error(
          `A figurinha estática não foi criada: ${outputStickerPath}`
        );
        await sock.sendMessage(msg.key.remoteJid, {
          text: "Erro ao criar figurinha estática. Tente novamente.",
        });
        return;
      }
      const stickerBuffer = fs.readFileSync(outputStickerPath);
      await sock.sendMessage(msg.key.remoteJid, { sticker: stickerBuffer });
      console.log("Figurinha estática enviada com sucesso!");
    }
  } catch (error) {
    console.error("Erro no comando !sticker:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Ocorreu um erro ao processar sua figurinha.",
    });
  }
}
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
module.exports = {
  createStickerCommand,
};
