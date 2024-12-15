const axios = require("axios");

module.exports = async function handlePesquisar(msg, sock, args) {
  let searchTerm = args.join(" ").replace("!pesquisar", "").trim();

  if (!searchTerm) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Você precisa fornecer um termo para pesquisar! 🔍",
    });
    return;
  }

  // Remove caracteres especiais que podem causar erro
  searchTerm = searchTerm.replace(/[!@#$%^&*(),.?":{}|<>]/g, "");

  try {
    // Faz a requisição para a API da Wikipedia
    const { data } = await axios.get(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        searchTerm
      )}`
    );

    if (data.extract) {
      // Monta a resposta com o resumo e o link da Wikipedia
      const summary = `📚 *${data.title}*\n\n${data.extract}\n\n🔗 Leia mais: ${data.content_urls.desktop.page}`;
      await sock.sendMessage(msg.key.remoteJid, { text: summary });
    } else {
      // Caso não encontre nada
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠ Nenhum resultado encontrado para o termo pesquisado.",
      });
    }
  } catch (error) {
    console.error("Erro ao buscar na Wikipedia:", error.message);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠ Ocorreu um erro ao realizar a pesquisa. Tente novamente mais tarde.",
    });
  }

  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "🔍", key: msg.key },
  });
};
