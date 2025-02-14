const axios = require("axios");

module.exports = async function handleJoke(msg, sock) {
  try {
    // Configura a URL da API para incluir todas as categorias
    const { data } = await axios.get("https://v2.jokeapi.dev/joke/Any?lang=pt");

    let jokeText;
    if (data.type === "single") {
      // Piada de uma linha
      jokeText = `😂 *Piada:*\n\n${data.joke}`;
    } else if (data.type === "twopart") {
      // Piada de duas partes
      jokeText = `😂 *Piada:*\n\n${data.setup}\n\n*Resposta:* ${data.delivery}`;
    } else {
      // Caso a API retorne um formato inesperado
      jokeText =
        "😅 Não consegui encontrar uma piada no momento. Tente novamente mais tarde!";
    }

    // Envia a piada como mensagem
    await sock.sendMessage(msg.key.remoteJid, { text: jokeText });
  } catch (error) {
    console.error("Erro ao buscar piada:", error.message);

    // Envia mensagem de erro ao usuário
    const errorMessage =
      "⚠ Ocorreu um erro ao buscar uma piada. Tente novamente mais tarde.";
    await sock.sendMessage(msg.key.remoteJid, { text: errorMessage });
  }

  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "😂", key: msg.key },
  });
};
