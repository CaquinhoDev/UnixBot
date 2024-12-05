module.exports = async function handleMoeda(msg, sock) {
  const flip = Math.random() < 0.5 ? "Cara" : "Coroa";
  const responseText = `🪙 O resultado do sorteio foi: *${flip}*.\n\n`;
  await sendMessageWithReaction(msg, sock, responseText, "🪙");
};

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` });
  await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
}
