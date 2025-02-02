module.exports = async function handlePing(msg, sock) {
  const start = Date.now();
  await sock.sendMessage(msg.key.remoteJid, {
    text: "🏓 Pong! Calculando o tempo de resposta...",
  });

  const end = Date.now();
  const ping = end - start;
  const responseText = `📶 Tempo de resposta: ${ping}ms\n\n`;
  await sendMessageWithReaction(msg, sock, responseText, "🏓");
};

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}` });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: emoji, key: msg.key },
  });
}
