const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

// Função para enviar o áudio para a API
const enviarAudioParaAPI = async (audioFilePath) => {
  try {
    // Cria um formulário para enviar o arquivo de áudio
    const form = new FormData();
    form.append("audio", fs.createReadStream(audioFilePath));

    const apiUrl = "https://5816-179-119-58-18.ngrok-free.app/processar_audio";

    // Fazendo a requisição POST para enviar o áudio
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Verifica a resposta da API
    if (response.status === 200) {
      console.log("Resposta da API recebida com sucesso");

      // Resposta da API
      const data = response.data;

      console.log("Transcrição: ", data.transcricao);
      console.log("Texto filtrado: ", data.filtrado);

      if (data.resultados) {
        console.log("Resultados da pesquisa: ", data.resultados);
      }

      if (data.audio) {
        console.log("Áudio gerado (em Base64):", data.audio);

        const buffer = Buffer.from(data.audio, "base64");
        fs.writeFileSync("resposta_audio.mp3", buffer);
        console.log("Áudio gerado salvo como resposta_audio.mp3");
      }

      return data; // Retorna os dados da resposta
    } else {
      throw new Error(`Erro inesperado da API: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Erro ao enviar áudio para a API:", error.message);
    throw new Error("Falha ao enviar áudio para a API.");
  }
};

module.exports = {
  enviarAudioParaAPI,
};
