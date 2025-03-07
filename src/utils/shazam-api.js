require("dotenv").config(); // Carregar variáveis do .env

const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

// Chave da API do Audd.io do arquivo .env
const SHAZAM_KEY = process.env.SHAZAM_KEY;

async function enviarAudioParaAPI(audioPath) {
  try {
    console.log("[SHAZAM-API] Preparando o envio do áudio para a API...");

    // Criar o FormData
    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioPath)); // Adiciona o arquivo de áudio
    formData.append("api_token", SHAZAM_KEY); // Adiciona a chave da API

    // Configurar os cabeçalhos
    const headers = {
      ...formData.getHeaders(),
    };

    console.log("[SHAZAM-API] Enviando requisição para a API do Audd.io...");

    const response = await axios.post("https://api.audd.io/", formData, {
      headers: headers,
      timeout: 10000,
    });

    console.log("[SHAZAM-API] Resposta da API recebida:", JSON.stringify(response.data, null, 2));

    // Verifica se a resposta contém um resultado válido
    if (response.data && response.data.result) {
      const music = response.data.result;

      console.log("[SHAZAM-API] Música identificada:", music.title);

      // Construir a resposta formatada
      const resultado = `🎵 *Música Identificada!*\n\n` +
        `📌 *Título:* ${music.title}\n` +
        `🎤 *Artista:* ${music.artist}\n` +
        (music.album ? `💽 *Álbum:* ${music.album}\n` : "") +
        `⏳ *Duração:* ${music.duration} segundos\n\n` +
        `🔗 *Ouça nas plataformas:*\n` +
        (music.spotify ? `🎧 [Spotify](${music.spotify})\n` : "") +
        (music.deezer ? `🎶 [Deezer](${music.deezer})\n` : "") +
        (music.apple_music ? `🍏 [Apple Music](${music.apple_music})\n` : "") +
        (music.song_link ? `🌐 [Outras plataformas](${music.song_link})\n` : "") +
        (music.lyrics ? `\n📝 *Letra:* ${music.lyrics.substring(0, 200)}...\n` : ""); // Mostra apenas um trecho da letra

      return resultado;
    } else {
      console.error("[SHAZAM-API] Erro: Música não encontrada.");
      return "❌ Nenhuma música foi encontrada no áudio enviado.";
    }
  } catch (error) {
    console.error("[SHAZAM-API] Erro na requisição para a API do Audd.io:", error.message);
    return "⚠️ Ocorreu um erro ao processar sua solicitação.";
  }
}

module.exports = {
  enviarAudioParaAPI,
};
