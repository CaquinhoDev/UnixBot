// src/commands/info.js
const simulateWhatsappResponse = require("../utils/simulateWhatsappResponse");

module.exports = async function comandoInfo(msg, sock) {
  const infoText = `Informações sobre o bot 🤖:\n\n- *Bot: UnixBot*\n- *Versão: 5.0! (finalmente update)*\n- *Criador: Pedro Henrique🧑‍💻*\n\n`;
  const messageEnd = "\nObrigado por usar o UnixBot";

  // Envia a mensagem padrão
  await sock.sendMessage(msg.key.remoteJid, {
    text: infoText + messageEnd,
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "ℹ️", key: msg.key },
  });

  // Simula a resposta da META AI
  await simulateWhatsappResponse(sock, msg.key.remoteJid, "by pedrin");
};
