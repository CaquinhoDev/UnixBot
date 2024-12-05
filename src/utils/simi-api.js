const axios = require('axios');
const FormData = require('form-data');

async function getSimSimiResponse(query) {
  const data = new FormData();
  data.append("lc", "pt");
  data.append("text", query);  

  const config = {
    method: "post",
    url: "https://api.simsimi.vn/v1/simtalk",
    headers: {
      ...data.getHeaders(),
    },
    data: data,
  };

  try {
    const response = await axios.request(config);

    // VERIFICA SE A RESPOSTA CONTEM UMA MESSAGE
    if (response.data && response.data.message && response.data.message !== "") {
      return response.data.message;
    } else {
      console.error("Erro: Nenhuma mensagem válida encontrada.");
      return "Desculpe, não consegui entender sua mensagem.";  
    }
  } catch (error) {
    console.error("Erro:", error);
    return "Desculpe, houve um erro ao processar sua mensagem.";  
  }
}

module.exports = { getSimSimiResponse };
