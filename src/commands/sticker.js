const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");

// Caminho para o diretório de stickers
const stickersDir = path.resolve(__dirname, "./stickers");
const MAX_STATIC_SIZE = 64 * 1024;

// Verificando se o diretório existe ou será criado
if (!fs.existsSync(stickersDir)) {
  fs.mkdirSync(stickersDir, { recursive: true });
}

async function createStaticSticker(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(512, 512) // Redimensiona para 512x512
      .webp({ quality: 50 }) // Define qualidade para 50%
      .toFile(outputPath);

    let stickerSize = fs.statSync(outputPath).size;
    while (stickerSize > MAX_STATIC_SIZE) {
      await sharp(inputPath)
        .resize(512, 512)
        .webp({ quality: 30 }) // Reduz ainda mais a qualidade
        .toFile(outputPath);
      stickerSize = fs.statSync(outputPath).size;
    }
  } catch (error) {
    throw new Error("Erro ao criar figurinha estática: " + error.message);
  }
}

async function createAnimatedSticker(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
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
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

async function createStickerCommand(msg, sock) {
  try {
    const message = msg.message;
    if (!message.imageMessage && !message.videoMessage) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Por favor, envie uma imagem ou vídeo.",
      });
      return;
    }

    const isVideo = !!message.videoMessage;
    const mediaMessage = isVideo ? message.videoMessage : message.imageMessage;
    const extension = isVideo ? ".mp4" : ".png";
    const inputPath = path.resolve(stickersDir, `input${extension}`);
    const outputPath = path.resolve(stickersDir, "sticker.webp");

    // Faz download da mídia
    const mediaStream = await downloadMediaMessage(msg, {
      logger: console,
      decrypt: true,
    });

    if (!mediaStream) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Erro ao baixar a mídia. Tente novamente.",
      });
      return;
    }

    const buffer = await streamToBuffer(mediaStream);
    fs.writeFileSync(inputPath, buffer);

    // Cria e envia a figurinha
    if (isVideo) {
      await createAnimatedSticker(inputPath, outputPath);
      const stickerBuffer = fs.readFileSync(outputPath);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBuffer,
        gifPlayback: true,
      });
    } else {
      await createStaticSticker(inputPath, outputPath);
      const stickerBuffer = fs.readFileSync(outputPath);
      await sock.sendMessage(msg.key.remoteJid, { sticker: stickerBuffer });
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
