const { translate } = require("@vitalets/google-translate-api");

const maxChars = 10000;

module.exports = async function handleTranslate(msg, sock, args) {
  // Obtendo a mensagem citada ou o texto enviado pelo usuário
  const quotedMsg =
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const text = quotedMsg
    ? quotedMsg.conversation || quotedMsg.imageMessage?.caption
    : args.join(" ").trim();

  // Verificando se o texto foi fornecido
  if (!text) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: spintax(
        `⚠ {Ei|Ops|Opa|Desculpe|Foi mal}, {para|pra} {utilizar|usar} o comando *!traduzir* ` +
          "{você|vc|tu} {precisa|deve} {escrever|digitar} {um texto|algo} {após |depois d}o comando. {🧐|🫠|🥲|🙃|📝}"
      ),
    });
    return;
  }

  // Verificando se o texto excede o limite
  if (text.length > maxChars) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: spintax(`⚠ O texto deve ter no máximo *${maxChars}* caracteres!`),
    });
    return;
  }

  // Tentando traduzir o texto
  try {
    const result = await translate(text, { to: "pt" }); // Traduzindo para português
    await sock.sendMessage(msg.key.remoteJid, {
      text: `*Tradutor*: ${result.text}`,
    });
  } catch (error) {
    console.warn("API: translate está offline!", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠ Desculpe, este serviço está indisponível no momento. Por favor, tente novamente mais tarde.",
    });
  }
};

// Função spintax para substituir palavras aleatórias
function spintax(text) {
  return text.replace(/\{([^}]+)\}/g, (_, group) => {
    const options = group.split("|");
    return options[Math.floor(Math.random() * options.length)];
  });
}
