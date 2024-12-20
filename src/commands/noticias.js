const { getNoticias } = require("../utils/noticias-api");
module.exports = async function handleNoticias(msg, sock) {
  try {
    console.log("Estamos no noticias.js");
    const noticias = await getNoticias();
    // Verifica se não há notícias disponíveis
    if (noticias.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Desculpe, não consegui obter as notícias no momento. Tente novamente mais tarde.",
      });
      return;
    }
    // Filtrando as notícias
    const noticiasValidas = noticias.filter((article) => {
      return (
        !article.title.includes("[Removed]") &&
        !article.url.includes("[Removed]") &&
        !article.title.includes("Removed") &&
        !article.url.includes("Removed")
      );
    });
    // Se não houver notícias válidas após o filtro
    if (noticiasValidas.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Desculpe, não há notícias disponíveis no momento.",
      });
      return;
    }
    // Formatação da resposta com as notícias válidas
    let messageText = "*📰 Principais notícias do momento:*\n\n";
    noticiasValidas.forEach((article, index) => {
      messageText += `*${index + 1}. ${article.title}*\n`;
      messageText += `${article.description}\n`;
      messageText += `Fonte: *${article.source}*\n`;
      messageText += `Leia mais: ${article.url}\n\n`;
    });
    // Enviando as notícias formatadas no WhatsApp
    await sock.sendMessage(msg.key.remoteJid, {
      text: messageText,
    });
    // Enviando uma reação para o usuário
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "📰", key: msg.key },
    });
  } catch (error) {
    console.error("Erro ao enviar notícias:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Ocorreu um erro ao tentar obter as notícias. Por favor, tente novamente mais tarde.",
    });
  }
};
