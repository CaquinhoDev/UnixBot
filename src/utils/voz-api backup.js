const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

// Função para enviar o áudio para a API
const enviarAudioParaAPI = async (audioFilePath) => {
  try {
    const form = new FormData();
    form.append("audio", fs.createReadStream(audioFilePath));

    const apiUrl = "https://fe30-177-161-139-57.ngrok-free.app/processar_audio"; // URL da sua API

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

        const audioDir = path.join(__dirname, "../commands/audios");
        if (!fs.existsSync(audioDir)) {
          fs.mkdirSync(audioDir, { recursive: true });
          console.log('Pasta "audios" criada.');
        }
        const outputFilePath = path.join(audioDir, "resposta_audio.mp3");
        const buffer = Buffer.from(data.audio, "base64");
        fs.writeFileSync(outputFilePath, buffer);
        console.log(`Áudio gerado e salvo como: ${outputFilePath}`);

        return outputFilePath;
      } else {
        console.log("Áudio não encontrado na resposta da API.");
      }
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
