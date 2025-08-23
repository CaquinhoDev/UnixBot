module.exports = async function handleRevelar(msg, sock, reagir) {
  async function reagir(jid, emoji, msg) {
    try {
      // O 'sock' é o seu cliente Baileys
      await sock.sendMessage(jid, {
        react: {
          text: emoji,
          key: msg.key, // A mensagem que você quer reagir
        },
      });
    } catch (err) {
      console.error("[REAÇÃO ERRO]", err);
    }
  }

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const viewOnce =
    quoted?.viewOnceMessage ||
    quoted?.viewOnceMessageV2 ||
    msg.message?.viewOnceMessage ||
    msg.message?.viewOnceMessageV2;

  const content = viewOnce?.message || quoted || message.message;
  const image = content?.imageMessage;
  const video = content?.videoMessage;
  const audio = content?.audioMessage;

  const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

  async function getBuffer(media, tipo) {
    const stream = await downloadContentFromMessage(media, tipo);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  }

  if (video) {
    await reagir(msg.key.remoteJid, "🎥", msg);
    const buffer = await getBuffer(video, "video");
    await sock.sendMessage(
      msg.key.remoteJid,
      {
        video: buffer,
        caption: "🎥 Aqui está o vídeo revelado!",
      },
      { quoted: msg }
    );
    await reagir(msg.key.remoteJid, "✅", msg);
  } else if (image) {
    await reagir(msg.key.remoteJid, "🖼️", msg);
    const buffer = await getBuffer(image, "image");
    await sock.sendMessage(
      msg.key.remoteJid,
      {
        image: buffer,
        caption: "🖼️ Aqui está a imagem revelada!",
      },
      { quoted: msg }
    );
    await reagir(msg.key.remoteJid, "✅", msg);
  } else if (audio) {
    await reagir(msg.key.remoteJid, "🎧", msg);
    const buffer = await getBuffer(audio, "audio");
    await sock.sendMessage(
      msg.key.remoteJid,
      {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: true,
      },
      { quoted: msg }
    );
    await reagir(msg.key.remoteJid, "✅", msg);
  } else {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "📌 Marque uma mídia de visualização única (imagem, vídeo ou áudio) para eu revelar!",
    });
  }
};
