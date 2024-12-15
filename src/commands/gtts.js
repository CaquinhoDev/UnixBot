const { existsSync, unlinkSync, writeFileSync } = require("fs");
const { join } = require("path");
const gTTS = require("gtts");

module.exports = async function handleGtts(msg, sock, args) {
  if (!args.length) {
    return await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠ Por favor, insira o idioma e o texto que deseja converter em áudio.\n\nExemplo: `!gtts pt Olá mundo!`",
    });
  }

  const language = args.shift().trim().toLowerCase(); // Primeiro argumento como idioma
  const text = args.join(" ").trim(); // Restante como texto

  if (!text) {
    return await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠ Por favor, insira o texto que deseja converter em áudio após o idioma.\n\nExemplo: `!gtts pt Olá mundo!`",
    });
  }

  // Idiomas disponíveis na biblioteca
  const availableLanguages = [
    "af",
    "ar",
    "bn",
    "bs",
    "ca",
    "cs",
    "cy",
    "da",
    "de",
    "el",
    "en",
    "eo",
    "es",
    "et",
    "fi",
    "fr",
    "gu",
    "hi",
    "hr",
    "hu",
    "id",
    "is",
    "it",
    "ja",
    "jw",
    "km",
    "kn",
    "ko",
    "la",
    "lv",
    "ml",
    "mr",
    "my",
    "ne",
    "nl",
    "no",
    "pl",
    "pt",
    "ro",
    "ru",
    "si",
    "sk",
    "sq",
    "sr",
    "su",
    "sv",
    "sw",
    "ta",
    "te",
    "th",
    "tl",
    "tr",
    "uk",
    "ur",
    "vi",
    "zh-cn",
    "zh-tw",
  ];

  // Verifica se o idioma é válido
  if (!availableLanguages.includes(language)) {
    return await sock.sendMessage(msg.key.remoteJid, {
      text: `⚠ Idioma inválido. Verifique na lista abaixo os idiomas disponíveis:\n\n${availableLanguages.join(
        ", "
      )}`,
    });
  }

  try {
    // Gera o áudio usando gTTS
    const gtts = new gTTS(text, language);
    const filePath = join(__dirname, "audios", `audio-${Date.now()}.mp3`); // Caminho temporário

    // Salva o áudio em um arquivo temporário
    gtts.save(filePath, async (err) => {
      if (err) {
        console.error("Erro ao salvar o arquivo de áudio:", err);
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "⚠ Ocorreu um erro ao gerar o áudio. Tente novamente mais tarde.",
        });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: filePath },
        mimetype: "audio/mpeg", // MIME de mp3 é audio/mpeg
        ptt: true, // true: Define como mensagem de voz, false: como mensagem de áudio
      });

      if (existsSync(filePath)) unlinkSync(filePath);
    });
  } catch (error) {
    console.error("Erro no comando !gtts:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠ Ocorreu um erro ao processar sua solicitação.",
    });
  }
};
