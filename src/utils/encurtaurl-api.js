const axios = require("axios");
// Função para encurtar a URL usando a API do is.gd
async function encurtarUrlIsgd(url) {
  // Verifica se a URL é válida
  console.log("URL:", url);
  if (!url || !isValidUrl(url)) {
    console.error("URL inválida ou vazia:", url);
    return null;
  }
  console.log("Recebendo URL para encurtar:", url);
  try {
    // Requisição GET para a API do is.gd
    const encodedUrl = encodeURIComponent(url);
    console.log("URL codificada: encodedUrl");
    const response = await axios.get(
      `https://is.gd/create.php?format=simple&url=${encodedUrl}`
    );
    // Verifica se a resposta da API é válida
    if (response.status === 200 && response.data) {
      console.log("Resposta da API is.gd:", response.data);
      return response.data;
    } else {
      console.error("Erro ao encurtar a URL, resposta inválida:", response);
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(
        "Erro 404: Recurso não encontrado. Verifique a URL da API."
      );
    } else {
      console.error("Erro ao encurtar a URL:", error.message);
    }
    return null;
  }
}
// Função simples para validar a URL antes de enviá-la para a API
function isValidUrl(url) {
  const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return regex.test(url);
}
module.exports = { encurtarUrlIsgd };
