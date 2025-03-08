require("dotenv").config(); 

const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

// Chave da API do Audd.io 
const SHAZAM_KEY = process.env.SHAZAM_KEY;

async function enviarAudioParaAPI(audioPath) {
  try {
    console.log("[SHAZAM-API] Preparando o envio do áudio para a API...");

    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioPath));
    formData.append("api_token", SHAZAM_KEY); 
    
    // Corrigindo a parte do headers
    const headers = formData.getHeaders(); 

    console.log("[SHAZAM-API] Enviando requisição para a API do Audd.io...");

    const response = await axios.post("https://api.audd.io/", formData, {
      headers: headers,
      timeout: 10000,
    });

    console.log("[SHAZAM-API] Resposta da API recebida:", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.result) {
      const music = response.data.result;

      console.log("[SHAZAM-API] Música identificada:", music.title);

      const resultado = `🎵 *Música Identificada!*\n\n` +
        `📌 *Título:* ${music.title}\n` +
        `🎤 *Artista:* ${music.artist}\n` +
        (music.album ? `💽 *Álbum:* ${music.album}\n` : "") +
        `⏳ *Duração:* ${music.timecode}\n\n` + 
        `🔗 *Ouça nas plataformas:*\n` +
        (music.song_link ? `🌐 [Outras plataformas](${music.song_link})\n` : "");

      return resultado;
    } else {
      console.error("[SHAZAM-API] Erro: Música não encontrada.");
      return "❌ Nenhuma música foi encontrada no áudio enviado.";
    }
  } catch (error) {
    console.error("[SHAZAM-API] Erro na requisição para a API do Audd.io:", error.message);
    return "⚠ Ocorreu um erro ao processar sua solicitação.";
  }
}

module.exports = {
  enviarAudioParaAPI,
};
