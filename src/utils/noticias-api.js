const axios = require("axios");
const { translate } = require("@vitalets/google-translate-api");
const API_KEY = "c226511368ba4c309d72d8fa7df6556e";
const BASE_URL = "https://newsapi.org/v2/top-headlines";
async function traduzirTexto(texto) {
  try {
    const result = await translate(texto, { to: "pt" });
    return result.text;
  } catch (error) {
    console.warn("Erro na tradução:", error);
    return texto; // Retorna o texto original em caso de erro
  }
}
// Função para obter as notícias globais e traduzi-las
async function getNoticias() {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        language: "en",
        apiKey: API_KEY,
      },
    });
    if (response.data.status === "ok") {
      if (response.data.articles && response.data.articles.length > 0) {
        // Traduzir as notícias para o português
        const noticiasTraduzidas = await Promise.all(
          response.data.articles.slice(0, 5).map(async (article) => {
            const tituloTraduzido = await traduzirTexto(article.title);
            const descricaoTraduzida = await traduzirTexto(
              article.description || "Sem descrição disponível"
            );
            return {
              title: tituloTraduzido,
              url: article.url,
              description: descricaoTraduzida,
              source: article.source.name,
            };
          })
        );
        return noticiasTraduzidas;
      } else {
        console.log("Nenhuma notícia disponível.");
        return [];
      }
    } else {
      console.error("Erro na resposta da API de notícias:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Erro ao obter notícias:", error);
    return [];
  }
}
module.exports = { getNoticias };
