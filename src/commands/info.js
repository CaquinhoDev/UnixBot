// src/commands/info.js
const simulateMetaAIResponse = require("../utils/simulateMetaAIResponse");

module.exports = async function comandoInfo(msg, sock) {
  const infoText = `Informações sobre o bot 🤖:\n\n- *Bot: Jarvis*\n- *Versão: 4.0!*\n- *Criador: Pedro Henrique🧑‍💻*\n\n`;
  const messageEnd = "\nObrigado por usar o Jarvis";

  // Envia a mensagem padrão
  await sock.sendMessage(msg.key.remoteJid, {
    text: infoText + messageEnd,
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "ℹ️", key: msg.key },
  });

  // Simula a resposta da META AI
  await simulateMetaAIResponse(
    sock,
    msg.key.remoteJid,
    "ℹ️ Obrigado por conferir as informações!"
  );
};
