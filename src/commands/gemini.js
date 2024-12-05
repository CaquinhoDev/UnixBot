const { getGeminiResponse } = require("../utils/gemini-api");

module.exports = async function handleGpt(msg, sock, args) {
  const message = args.join(" ").trim(); // Pegando o texto da mensagem

  if (!message) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "*Por favor, forneça uma mensagem para o Gemini.*",
    });
    return;
  }

  try {
    const responseText = await getGeminiResponse(message);

    await sock.sendMessage(msg.key.remoteJid, {
      text: responseText,
    });
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "🤖", key: msg.key }, // Reação para Gemini
    });
  } catch (error) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `*Erro ao se comunicar com a API Gemini:* ${error.message}`,
    });
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }, // Reação de erro para Gemini
    });
  }
};
