const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.UNSPLASH_API_KEY;

/**
 * Função para buscar e baixar uma imagem relacionada a uma palavra-chave
 * @param {string} query - Palavra-chave para busca
 * @returns {Buffer} - Buffer da imagem encontrada
 */

async function buscarImagem(keyword) {
  try {
    // Fazendo request
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: {
        query: keyword,
        client_id: API_KEY,
      },
    });

    if (response.data.results.length > 0) {
      const imageUrl = response.data.results[0].urls.regular;
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      return imageResponse.data; // Retorna o buffer da imagem
    } else {
      throw new Error(`Nenhuma imagem encontrada para "${query}".`);
    }
  } catch (error) {
    console.error("Erro ao buscar a imagem:", error.message);
    throw error; // Propaga o erro para o código principal
  }
}

module.exports = { buscarImagem };
