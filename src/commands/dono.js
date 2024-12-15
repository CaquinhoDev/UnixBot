module.exports = async function handleDono(msg, sock) {
  try {
    // Defina os dados do bot
    const botName = "ᴍᴇᴜ ᴅᴏɴᴏ 👑";
    const botPhone = "5511913372146";

    // Criação do vCard
    const vcard =
      `BEGIN:VCARD\n` +
      `VERSION:3.0\n` +
      `FN:${botName} 🤖\n` +
      `TEL;type=CELL;type=VOICE;waid=${botPhone}:${botPhone}\n` +
      `END:VCARD`;

    // Envia o contato no formato de vCard
    await sock.sendMessage(msg.key.remoteJid, {
      contacts: {
        displayName: `${botName} 🤖`,
        contacts: [{ vcard }],
      },
    });

    // sucesso
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "📇", key: msg.key },
    });
  } catch (error) {
    //erro
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Não foi possível enviar o contato. Tente novamente mais tarde.",
    });

    // Reação de erro
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key },
    });
  }
};
