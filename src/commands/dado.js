module.exports = async function handleDado(msg, sock) {
  const roll = Math.floor(Math.random() * 6) + 1;
  await sock.sendMessage(msg.key.remoteJid, {
    text: `🎲 O número sorteado no dado foi: *${roll}*\n\n`,
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "🎲", key: msg.key },
  });
};
