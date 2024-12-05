// simi.js
const { getSimSimiResponse } = require("../utils/simi-api");

module.exports = async function handleSimi(msg, sock, args) {
  const question = args.join(" ").trim();
  if (!question) {
    await sendMessageWithReaction(msg, sock, "*Por favor, forneça uma mensagem para o SimSimi.*", "❌");
    return;
  }

  try {
    const response = await getSimSimiResponse(question);
    await sendMessageWithReaction(msg, sock, response + `\n\n`, "🐥");
  } catch (error) {
    await sendMessageWithReaction(msg, sock, `*Erro ao se comunicar com a API SimSimi:* ${error.message}\n\n`, "❌");
  }
};

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` });
  await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
}
