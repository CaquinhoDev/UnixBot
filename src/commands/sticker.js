const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { downloadMediaMessage } = require("baileys");
const ffmpeg = require("fluent-ffmpeg");

// Caminho para o diretório de stickers
const stickersDir = path.resolve(__dirname, "./stickers");
const MAX_STATIC_SIZE = 64 * 1024;

// Verificando se o diretório existe ou será criado
if (!fs.existsSync(stickersDir)) {
  fs.mkdirSync(stickersDir, { recursive: true });
}

async function createStaticSticker(inputPath, outputPath, isStretched = false) {
  try {
    let options;
    if (isStretched) {
      // Esticado - ignora aspect ratio e faz fit completo
      options = sharp(inputPath).resize(512, 512, {
        fit: "fill",
      });
    } else {
      // Normal - mantém aspect ratio
      options = sharp(inputPath).resize(512, 512, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      });
    }

    await options.webp({ quality: 50 }).toFile(outputPath);

    let stickerSize = fs.statSync(outputPath).size;
    while (stickerSize > MAX_STATIC_SIZE) {
      if (isStretched) {
        await sharp(inputPath)
          .resize(512, 512, { fit: "fill" })
          .webp({ quality: 30 })
          .toFile(outputPath);
      } else {
        await sharp(inputPath)
          .resize(512, 512, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .webp({ quality: 30 })
          .toFile(outputPath);
      }
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
    const outputPathNormal = path.resolve(stickersDir, "sticker_normal.webp");
    const outputPathStretched = path.resolve(
      stickersDir,
      "sticker_stretched.webp",
    );

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

    // Cria e envia as figurinhas
    if (isVideo) {
      // Para vídeo, cria apenas a versão normal (gif animado)
      await createAnimatedSticker(inputPath, outputPathNormal);
      const stickerBuffer = fs.readFileSync(outputPathNormal);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBuffer,
        gifPlayback: true,
      });
    } else {
      // Para imagem, cria as 2 versões
      await createStaticSticker(inputPath, outputPathNormal, false);
      const stickerBufferNormal = fs.readFileSync(outputPathNormal);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBufferNormal,
      });

      // Aguarda um pouco antes de enviar a segunda
      await new Promise((resolve) => setTimeout(resolve, 500));

      await createStaticSticker(inputPath, outputPathStretched, true);
      const stickerBufferStretched = fs.readFileSync(outputPathStretched);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBufferStretched,
      });
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
