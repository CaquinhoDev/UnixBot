module.exports = async function handleDono(msg, sock) {
  await sock.sendMessage(msg.key.remoteJid, {
    text: "O dono do bot é *Pedro Henrique*. 👑\n\n",
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "👑", key: msg.key },
  });
};
