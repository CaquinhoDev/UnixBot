const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const ytsr = require("ytsr");
const path = require("path");

// Função para verificar se a URL é do YouTube
const isYouTubeUrl = (url) => {
  const youtubeUrlPattern =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/).+$/;
  return youtubeUrlPattern.test(url);
};

// Função para buscar o vídeo mais relevante no YouTube
const getUrlByQuery = async (query) => {
  try {
    const searchResults = await ytsr(query, { limit: 1 });
    const firstVideo = searchResults.items.find(
      (item) => item.type === "video"
    );
    return firstVideo ? firstVideo.url : null;
  } catch (error) {
    return null;
  }
};

// Função para fazer o download do áudio do vídeo do YouTube
const downloadAudioFromYouTube = async (url, filePath) => {
  try {
    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
    if (audioFormats.length === 0) {
      throw new Error("Nenhum formato de áudio disponível.");
    }

    const audioFormat = audioFormats[0];
    const videoStream = ytdl(url, { format: audioFormat });

    const fileWriteStream = fs.createWriteStream(filePath);
    videoStream.pipe(fileWriteStream);

    return new Promise((resolve, reject) => {
      videoStream.on("end", () => resolve(filePath));
      videoStream.on("error", (error) => reject(error));
    });
  } catch {
    throw new Error("Erro ao baixar áudio.");
  }
};

const compressAudio = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("aac")
      .audioBitrate(128)
      .toFormat("mp4")
      .on("error", (error) => reject(error))
      .on("end", () => resolve(outputPath))
      .save(outputPath); // Salva o arquivo compactado
  });
};

// Função para enviar o áudio para o usuário no WhatsApp
const enviarAudioGravacao = async (message, arquivo, sock) => {
  try {
    await sock.sendMessage(
      message.key.remoteJid,
      {
        audio: fs.readFileSync(arquivo),
        mimetype: "audio/mp4",
        ptt: false,
      },
      { quoted: message }
    );
  } catch {}
};

// Função principal
const downloadYouTubeVideo = async (msg, sock, args) => {
  const query = args.join(" ");
  let url = "";

  // Verifica se o usuário enviou a URL diretamente
  if (isYouTubeUrl(query)) {
    url = query;
  } else {
    url = await getUrlByQuery(query);
    if (!url) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Não foi possível encontrar o vídeo.",
      });
      return;
    }
  }

  const videoId = url.split("v=")[1];
  const tempFilePath = path.join(__dirname, "youtube", `${videoId}.mp4`);
  const outputFilePath = path.join(__dirname, "youtube", `${videoId}.mp3`);

  try {
    // Baixar o áudio
    await downloadAudioFromYouTube(url, tempFilePath);

    // Compactar o áudio
    await compressAudio(tempFilePath, outputFilePath);

    // Enviar o arquivo de áudio para o WhatsApp
    await enviarAudioGravacao(msg, outputFilePath, sock);
  } catch {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Houve um erro ao processar o vídeo. Tente novamente mais tarde.",
    });
  } finally {
    // Limpar arquivos temporários
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
    } catch {}
  }
};

module.exports = { downloadYouTubeVideo };
