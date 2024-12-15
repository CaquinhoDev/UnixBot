const axios = require("axios");

function spintax(text) {
  return text.replace(/{([^{}]*)}/g, (_, group) => {
    const choices = group.split("|");
    return choices[Math.floor(Math.random() * choices.length)];
  });
}

module.exports = async function handleDDD(msg, sock, args) {
  const ddd = args.join(" ").replace("!ddd", "").trim().replace(/\D/g, ""); // Remove caracteres não numéricos

  // Valida o DDD
  if (!/^\d{2}$/.test(ddd)) {
    const errorMessage =
      "⚠ {Ei|Ops|Opa|Desculpe|Foi mal}, o DDD fornecido é inválido. " +
      "Por favor, insira um DDD válido de *2 dígitos* e tente novamente.";
    await sock.sendMessage(msg.key.remoteJid, { text: spintax(errorMessage) });
    return;
  }

  try {
    // Faz a requisição na BrasilAPI
    const { data } = await axios.get(
      `https://brasilapi.com.br/api/ddd/v1/${ddd}`
    );
    const { state, cities } = data;

    // Monta a resposta com as informações
    const response =
      `📞 *Informações do DDD ${ddd}:*\n\n` +
      `🗺️ *Estado:* ${state}\n` +
      `🏙️ *Cidades:*\n${cities
        .reverse()
        .map((city) => `- ${city}`)
        .join("\n")}\n\n` +
      `_Consultado com o bot do Pedro._`;

    // Envia a mensagem com as informações
    await sock.sendMessage(msg.key.remoteJid, { text: spintax(response) });
  } catch (error) {
    // Loga o erro e informa ao usuário
    console.warn("API: BrasilAPI/DDD error!", error.message);
    const reply =
      "⚠ Desculpe, não consegui obter informações para o DDD fornecido. " +
      "Por favor, verifique se está correto e tente novamente.";
    await sock.sendMessage(msg.key.remoteJid, { text: reply });
  }
};
