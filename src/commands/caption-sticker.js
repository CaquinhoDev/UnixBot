const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { downloadMediaMessage } = require("baileys");
const ffmpeg = require("fluent-ffmpeg");

// Caminho para o diretório de stickers
const stickersDir = path.resolve(__dirname, "./stickers");
const MAX_STATIC_SIZE = 64 * 1024;

// Verifica se o diretório de stickers existe, se não, cria
if (!fs.existsSync(stickersDir)) {
  fs.mkdirSync(stickersDir, { recursive: true });
}

// Função para criar figurinha estática (normal ou esticada)
async function createStaticSticker(
  inputPath,
  outputPath,
  stretch = false,
  caption = null
) {
  try {
    let img = sharp(inputPath);

    if (stretch) {
      img = img.resize(512, 512); // Estica para caber no quadrado
    } else {
      img = img.resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    // Adiciona legenda na imagem, se houver
    if (caption) {
      img = img.composite([
        {
          input: Buffer.from(
            `<svg width="512" height="80">
              <rect x="0" y="0" width="512" height="80" rx="20" ry="20" fill="black" opacity="0.5"/>
              <text x="50%" y="50%" font-size="40" text-anchor="middle" fill="white" font-family="Arial" dy=".3em">${caption}</text>
            </svg>`
          ),
          top: 432,
          left: 0,
        },
      ]);
    }

    await img.webp({ quality: 50 }).toFile(outputPath);

    // Reduz qualidade se ficar muito pesado
    let stickerSize = fs.statSync(outputPath).size;
    while (stickerSize > MAX_STATIC_SIZE) {
      await img.webp({ quality: 30 }).toFile(outputPath);
      stickerSize = fs.statSync(outputPath).size;
    }
  } catch (error) {
    throw new Error("Erro ao criar figurinha estática: " + error.message);
  }
}

// Função para criar figurinha animada
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

// Função principal que lida com o comando de criar figurinha
async function createStickerCommand(msg, sock) {
  try {
    const message = msg.message;

    // 1. Tenta pegar a mídia da mensagem atual (legenda)
    let mediaMessage = message.imageMessage || message.videoMessage;

    // 2. Pega o texto da legenda para escrever na figurinha (opcional)
    let captionText =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      null;

    // 3. Se não tem mídia na mensagem atual, verifica se é uma RESPOSTA (quoted)
    if (
      !mediaMessage &&
      message.extendedTextMessage &&
      message.extendedTextMessage.contextInfo
    ) {
      const quotedMsg = message.extendedTextMessage.contextInfo.quotedMessage;
      if (quotedMsg) {
        mediaMessage = quotedMsg.imageMessage || quotedMsg.videoMessage;

        // Se estamos pegando de uma resposta, removemos o comando "!sticker" do texto da legenda
        // para não sair escrito na imagem
        if (captionText) {
          // Ex: "!sticker legal" -> vira "legal"
          const parts = captionText.split(" ");
          if (parts.length > 1) {
            captionText = parts.slice(1).join(" ");
          } else {
            captionText = null;
          }
        }
      }
    }

    if (!mediaMessage) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Por favor, envie uma imagem/vídeo ou responda a uma mídia com o comando.",
      });
      return;
    }

    // Identifica se é vídeo verificando o mimetype ou a estrutura
    const isVideo =
      mediaMessage.mimetype?.includes("video") || mediaMessage.seconds > 0;

    const extension = isVideo ? ".mp4" : ".png";
    const inputPath = path.resolve(stickersDir, `input${extension}`);
    const outputPathNormal = path.resolve(stickersDir, "sticker_normal.webp");
    const outputPathStretched = path.resolve(
      stickersDir,
      "sticker_stretched.webp"
    ); // Opcional

    // --- CORREÇÃO DO DOWNLOAD ---

    // Precisamos recriar a estrutura da mensagem para o Baileys achar a chave de descriptografia
    const messageType = isVideo ? "videoMessage" : "imageMessage";

    const msgToDownload = {
      key: msg.key,
      message: {
        [messageType]: mediaMessage,
      },
    };

    // Reage com ampulheta
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "⏳", key: msg.key },
    });

    // Faz o download direto como BUFFER (não precisa mais de streamToBuffer)
    const buffer = await downloadMediaMessage(msgToDownload, "buffer", {
      logger: console,
      reuploadRequest: msg.key.id,
    });

    if (!buffer) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Erro ao baixar a mídia. Tente novamente.",
      });
      return;
    }

    // Salva o buffer no arquivo de entrada
    fs.writeFileSync(inputPath, buffer);

    // Processa o vídeo ou a imagem
    if (isVideo) {
      await createAnimatedSticker(inputPath, outputPathNormal);
      const stickerBuffer = fs.readFileSync(outputPathNormal);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBuffer,
        gifPlayback: true,
      });
    } else {
      // Criar figurinha estática normal
      await createStaticSticker(
        inputPath,
        outputPathNormal,
        false,
        captionText
      );
      const stickerBufferNormal = fs.readFileSync(outputPathNormal);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBufferNormal,
      });

      // Se quiser enviar a versão esticada também, descomente as linhas abaixo:

      await createStaticSticker(
        inputPath,
        outputPathStretched,
        true,
        captionText
      );
      const stickerBufferStretched = fs.readFileSync(outputPathStretched);
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBufferStretched,
      });
    }

    // Reage com sucesso
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key },
    });
  } catch (error) {
    console.error("Erro no comando !sticker:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Ocorreu um erro ao processar sua figurinha.",
    });
  }
}

module.exports = {
  createStickerCommand,
};
