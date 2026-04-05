module.exports = async function handlePing(msg, sock) {
  const start = Date.now();  // Calculando o tempo antes do envio

  // Enviando a mensagem de ping
  await sock.sendMessage(msg.key.remoteJid, {
    text: "🏓 Pong! Calculando o tempo de resposta, só um instante...",
  });

  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "🏓", key: msg.key },
  });

  const end = Date.now();  // Calculando o tempo após o envio
  const ping = end - start;  // Calculando a diferença de tempo

  // Enviando o tempo de resposta
  await sock.sendMessage(msg.key.remoteJid, {
    text: `📶 Tempo de resposta: ${ping}ms`,
  });
};
