const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const crypto = require("crypto");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { exec } = require("child_process");

module.exports = async (msg, sock) => {
  const message = msg.message;
  console.log("Função de áudio (voz.js) chamada!");

  if (message && message.audioMessage) {
    console.log("Iniciando o processamento do áudio...");

    const audioMessage = message.audioMessage;

    if (audioMessage) {
      try {
        console.log("Baixando a mídia...");

        // Baixar o arquivo criptografado .enc e descriptografá-lo automaticamente
        const mediaStream = await downloadMediaMessage(msg, {
          logger: console,
          decrypt: true,
        });

        if (!mediaStream) {
          throw new Error("Erro ao baixar a mídia.");
        }

        // Converter o stream para buffer
        const buffer = await new Promise((resolve, reject) => {
          streamToBuffer(mediaStream, (err, buffer) => {
            if (err)
              return reject(
                `Erro ao converter stream para buffer: ${err.message}`
              );
            resolve(buffer);
          });
        });

        // Verificar o tamanho do arquivo
        if (buffer.length === 0) {
          throw new Error("O arquivo baixado está vazio.");
        }
        console.log(`Tamanho do arquivo baixado: ${buffer.length} bytes`);

        // Salvar o arquivo temporário como .enc
        const tempFilePath = path.join(__dirname, "tempAudio.enc");
        fs.writeFileSync(tempFilePath, buffer);
        console.log(`Arquivo salvo temporariamente em: ${tempFilePath}`);

        // Verificar o tipo de arquivo com 'file' (no Linux ou com ferramentas semelhantes)
        const fileType = await checkFileType(tempFilePath);
        console.log(`Tipo de arquivo detectado: ${fileType}`);

        // Processar diferentes tipos de áudio
        let outputFilePath = "";
        if (
          fileType.startsWith("audio/ogg") ||
          fileType.startsWith("audio/mpeg") ||
          fileType.startsWith("audio/wav")
        ) {
          // Força conversão para mp3 ou wav, independentemente do tipo original
          outputFilePath = await processAudio(tempFilePath, "mp3");
        } else {
          throw new Error("Formato de áudio não suportado.");
        }

        // Após a conversão, excluir o arquivo temporário
        fs.unlinkSync(tempFilePath);
        console.log(
          `Arquivo convertido para o formato desejado e salvo em ${outputFilePath}`
        );

        // Chamar a API para processar o áudio e obter os dados
        const data = await require("../utils/voz-api").enviarAudioParaAPI(
          outputFilePath
        );

        if (data.resultados) {
          // Criar a mensagem com os artigos
          const artigosMensagem = data.resultados
            .map((artigo, index) => {
              return `${index + 1}. Título: ${artigo.titulo}\nDescrição: ${
                artigo.descricao
              }\nLink: ${artigo.link}\n`;
            })
            .join("\n");

          // Enviar a mensagem de texto com os artigos
          await sock.sendMessage(msg.key.remoteJid, { text: artigosMensagem });

          // Preparar o áudio gerado e enviar
          const audioPath = path.join(
            __dirname,
            "audios",
            "resposta_audio.mp3"
          );
          const audioBuffer = Buffer.from(data.audio, "base64");
          fs.writeFileSync(audioPath, audioBuffer);

          const sendAudioMessage = async (sock, jid) => {
            try {
              await sock.sendMessage(jid, {
                audio: { url: audioPath },
                mimetype: "audio/mpeg",
              });
              console.log("Áudio enviado com sucesso!");
            } catch (error) {
              console.error("Erro ao enviar o áudio:", error.message);
            }
          };

          const jid = msg?.key?.remoteJid;
          await sendAudioMessage(sock, jid);
        } else {
          console.error("Erro na API de voz: resultados não encontrados.");
          await sock.sendMessage(msg.key.remoteJid, {
            text: "Houve um erro ao tentar processar os resultados do áudio.",
          });
        }
      } catch (error) {
        console.error("Erro no processamento do áudio:", error.message);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "Houve um erro ao tentar baixar ou processar o áudio.",
        });
      }
    }
  } else {
    console.log("A mensagem não contém um áudio válido.");
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Por favor, envie uma mensagem de áudio válida.",
    });
  }
};

// Função para verificar o tipo de arquivo
function checkFileType(filePath) {
  return new Promise((resolve, reject) => {
    exec(`file --mime-type -b ${filePath}`, (err, stdout, stderr) => {
      if (err) {
        reject(`Erro ao verificar tipo de arquivo: ${stderr || err.message}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Função para processar áudio e salvar no formato correto
async function processAudio(inputFilePath, format) {
  const audioDir = path.join(__dirname, "audios");
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const outputFilePath = path.join(
    audioDir,
    `${crypto.randomBytes(8).toString("hex")}.${format}`
  );
  console.log(`Caminho de saída para ffmpeg: ${outputFilePath}`);

  await convertAudio(inputFilePath, outputFilePath, format);
  return outputFilePath;
}

// Função para converter áudio para o formato desejado
function convertAudio(inputFilePath, outputFilePath, format) {
  return new Promise((resolve, reject) => {
    console.log(
      `Iniciando conversão para ${format} de: ${inputFilePath} para: ${outputFilePath}`
    );

    let ffmpegCommand = ffmpeg(inputFilePath)
      .on("end", () => {
        console.log(`Áudio convertido para ${format} com sucesso!`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`Erro na conversão para ${format}: ${err.message}`);
        reject(new Error(`Erro na conversão para ${format}: ${err.message}`));
      });

    switch (format) {
      case "mp3":
        ffmpegCommand = ffmpegCommand
          .audioCodec("libmp3lame")
          .audioBitrate("128k");
        break;
      case "wav":
        ffmpegCommand = ffmpegCommand
          .audioCodec("pcm_s16le")
          .audioBitrate("128k");
        break;
      default:
        reject(new Error("Formato de áudio não suportado"));
        return;
    }

    ffmpegCommand.save(outputFilePath);
  });
}

// Função para converter o stream para buffer
function streamToBuffer(stream, callback) {
  let chunks = [];
  stream.on("data", (chunk) => {
    chunks.push(chunk);
  });
  stream.on("end", () => {
    callback(null, Buffer.concat(chunks));
  });
  stream.on("error", (err) => {
    callback(err, null);
  });
}
