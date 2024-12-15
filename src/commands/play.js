const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const ytsr = require('ytsr');
const path = require('path');

// Função para verificar se a URL é do YouTube
const isYouTubeUrl = (url) => {
  const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/).+$/;
  console.log(`Verificando se é uma URL do YouTube: ${url}`);
  return youtubeUrlPattern.test(url);
};

// Função para buscar o vídeo mais relevante no YouTube 
const getUrlByQuery = async (query) => {
  console.log(`Buscando vídeo para a query: ${query}`);
  try {
    const searchResults = await ytsr(query, { limit: 1 });
    const firstVideo = searchResults.items.find(item => item.type === 'video');
    if (firstVideo) {
      console.log(`Resultado da busca: ${firstVideo.url}`);
      return firstVideo.url;
    } else {
      console.log('Nenhum vídeo encontrado.');
      return null;
    }
  } catch (error) {
    console.error(`Erro ao realizar busca no YouTube: ${error.message}`);
    return null;
  }
};

// Função para fazer o download do áudio do vídeo do YouTube
const downloadAudioFromYouTube = async (url, filePath) => {
  console.log(`Iniciando o download do áudio do vídeo: ${url}`);
  try {
    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    if (audioFormats.length === 0) {
      throw new Error('Nenhum formato de áudio disponível.');
    }

    const audioFormat = audioFormats[0]; 
    console.log(`Formato de áudio selecionado: ${audioFormat.container}`);
    const videoStream = ytdl(url, { format: audioFormat });

    const fileWriteStream = fs.createWriteStream(filePath);
    videoStream.pipe(fileWriteStream);

    return new Promise((resolve, reject) => {
      videoStream.on('end', () => {
        console.log(`Download do áudio concluído: ${filePath}`);
        resolve(filePath);
      });
      videoStream.on('error', (error) => {
        console.error(`Erro ao baixar áudio: ${error.message}`);
        reject(error);
      });
    });
  } catch (error) {
    console.error(`Erro ao baixar áudio: ${error.message}`);
    throw new Error('Erro ao baixar áudio.');
  }
};

const compressAudio = (inputPath, outputPath) => {
  console.log(`Iniciando a compressão de áudio: ${inputPath}`);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('aac')  
      .audioBitrate(128)
      .toFormat('mp4')
      .on('start', (commandLine) => {
        console.log(`Comando FFmpeg: ${commandLine}`);
      })
      .on('stderr', (stderrLine) => {
        console.error(`FFmpeg stderr: ${stderrLine}`);
      })
      .on('stdout', (stdoutLine) => {
        console.log(`FFmpeg stdout: ${stdoutLine}`);
      })
      .on('error', (error, stdout, stderr) => {
        console.error(`Erro ao compactar áudio: ${error.message}`);
        console.error(`FFmpeg stdout: ${stdout}`);
        console.error(`FFmpeg stderr: ${stderr}`);
        reject(error);
      })
      .on('end', () => {
        console.log(`Áudio compactado com sucesso para: ${outputPath}`);
        resolve(outputPath);
      })
      .save(outputPath); // Salva o arquivo compactado
  });
};


// Função para enviar o áudio para o usuário no WhatsApp
const enviarAudioGravacao = async (message, arquivo, sock) => {
  try {
    await sock.sendMessage(message.key.remoteJid, {
      audio: fs.readFileSync(arquivo),
      mimetype: 'audio/mp4', 
      ptt: true,              
    }, { quoted: message });
    console.log('Áudio enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar áudio:', error);
  }
};

// Função principal
const downloadYouTubeVideo = async (msg, sock, args) => {
  console.log(`Iniciando o processo para o comando !youtube com os argumentos: ${args}`);
  const query = args.join(' ');
  let url = '';

  // Verifica se o usuário enviou a URL diretamente
  if (isYouTubeUrl(query)) {
    console.log('URL do YouTube fornecida diretamente');
    url = query;
  } else {
    console.log('Realizando busca por nome de vídeo');
    url = await getUrlByQuery(query);
    if (!url) {
      console.log('Não foi possível encontrar o vídeo.');
      await sock.sendMessage(msg.key.remoteJid, { text: 'Não foi possível encontrar o vídeo.' });
      return;
    }
  }

  const videoId = url.split('v=')[1];
  const tempFilePath = path.join(__dirname, 'youtube', `${videoId}.mp4`);
  const outputFilePath = path.join(__dirname, 'youtube', `${videoId}.mp3`);

  try {
    // Baixar o áudio
    console.log(`Iniciando o download do áudio para o vídeo: ${url}`);
    await downloadAudioFromYouTube(url, tempFilePath);

    // Compactar o áudio
    console.log(`Compactando o áudio para o WhatsApp...`);
    await compressAudio(tempFilePath, outputFilePath);

    // Enviar o arquivo de áudio para o WhatsApp
    await enviarAudioGravacao(msg, outputFilePath, sock);
    console.log(`Áudio enviado para o usuário: ${msg.key.remoteJid}`);
  } catch (error) {
    console.error(`Erro ao processar o vídeo: ${error.message}`);
    await sock.sendMessage(msg.key.remoteJid, { text: 'Houve um erro ao processar o vídeo. Tente novamente mais tarde.' });
  } finally {
    // Limpar arquivos temporários 
    try {
      if (fs.existsSync(tempFilePath)) {
        console.log(`Removendo arquivo temporário: ${tempFilePath}`);
        fs.unlinkSync(tempFilePath);
      }
      if (fs.existsSync(outputFilePath)) {
        console.log(`Removendo arquivo temporário: ${outputFilePath}`);
        fs.unlinkSync(outputFilePath);
      }
    } catch (cleanError) {
      console.error(`Erro ao limpar arquivos temporários: ${cleanError.message}`);
    }
  }
};

module.exports = { downloadYouTubeVideo };
