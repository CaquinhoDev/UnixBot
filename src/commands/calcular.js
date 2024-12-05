const math = require("mathjs");

module.exports = async function handleCalcular(msg, sock, args) {
  const expression = args.join(" ").trim(); 

  if (!expression) {
    await sendMessageWithReaction(msg, sock, "*Por favor, forneça uma expressão para calcular.*", "❌");
    return;
  }

  try {
    const result = math.evaluate(expression);
    await sendMessageWithReaction(msg, sock, `*Resultado:* ${result}`, "📊");
  } catch (error) {
    await sendMessageWithReaction(msg, sock, `*Erro ao calcular a expressão:* ${error.message}`, "❌");
  }
};

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` });
  await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
}
