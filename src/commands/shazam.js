
const fs = require("fs").promises;
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { enviarAudioParaAPI } = require("../utils/shazam-api");

const listeningMode = {};

module.exports = async (msg, sock) => {
  try {
    const message = msg.message;
    const chatId = msg.key.remoteJid;

    console.log("[SHAZAM] Função de Shazam chamada!");
    console.log("[SHAZAM] Mensagem recebida:", JSON.stringify(msg, null, 2));

    if (message.extendedTextMessage && message.extendedTextMessage.text === "!shazam") {
      console.log("[SHAZAM] Comando !shazam detectado, entrando em modo de escuta...");
      listeningMode[chatId] = true;
      await sock.sendMessage(chatId, { text: "Modo Shazam ativado. Envie o áudio que deseja identificar." });
      return;
    }

    
    if (listeningMode[chatId] && message.audioMessage) {
      console.log("[SHAZAM] Áudio detectado, processando...");

      try {
        console.log("[SHAZAM] Baixando o áudio...");
        const mediaStream = await downloadMediaMessage(msg, {
          logger: console,
          decrypt: true,
        });

        if (!mediaStream) {
          throw new Error("Erro ao baixar a mídia.");
        }

        console.log("[SHAZAM] Áudio baixado com sucesso.");

        const buffer = await streamToBuffer(mediaStream);

        if (buffer.length === 0) {
          throw new Error("O arquivo está vazio.");
        }

        console.log(`[SHAZAM] Tamanho do arquivo baixado: ${buffer.length} bytes`);

        const tempFilePath = path.join(__dirname, "tempAudio.ogg"); 
        await fs.writeFile(tempFilePath, buffer);
        console.log(`[SHAZAM] Arquivo salvo temporariamente em: ${tempFilePath}`);

        console.log("[SHAZAM] Enviando áudio para a API...");
        const musicData = await enviarAudioParaAPI(tempFilePath);

        await fs.unlink(tempFilePath);
        console.log("[SHAZAM] Arquivo temporário deletado.");

        if (musicData) {
          await sock.sendMessage(chatId, { text: musicData }); 
          console.log("[SHAZAM] Resposta enviada ao usuário.");
        } else {
          await sock.sendMessage(chatId, {
            text: "Não consegui identificar a música. Tente novamente.",
          });
          console.log("[SHAZAM] Música não identificada.");
        }
      } catch (error) {
        console.error("[SHAZAM] Erro ao processar o áudio:", error.message);
        await sock.sendMessage(chatId, {
          text: "Houve um erro ao tentar processar o áudio. Tente novamente.",
        });
      } finally {
        delete listeningMode[chatId];
      }
    } else if (listeningMode[chatId]) {
      console.log("[SHAZAM] Mensagem não contém áudio.");
      await sock.sendMessage(chatId, {
        text: "Por favor, envie uma mensagem de áudio para identificar a música.",
      });
    }
  } catch (error) {
    console.error("[SHAZAM] Erro geral na função Shazam:", error.message);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    });
  }
};

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
}

