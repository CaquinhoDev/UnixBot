// info.js
module.exports = async function comandoInfo(msg, sock) {
  const infoText = `Informações sobre o bot 🤖:\n\n- *Bot: MagoBot*\n- *Versão: 1.4*\n- *Criador: Pedro Henrique 🧑‍💻*\n\n`;
  const messageEnd = "\nObrigado por usar o MagoBot!"; 

  await sock.sendMessage(msg.key.remoteJid, {
    text: infoText + messageEnd,
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "ℹ️", key: msg.key },
  });
};
