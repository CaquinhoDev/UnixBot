// src/utils/simulateMetaAIResponse.js
module.exports = async function simulateMetaAIResponse(
  sock,
  remoteJid,
  customText
) {
  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "FN:Meta AI\n" +
    "ORG:By Caquinho Dev;\n" +
    "TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\n" +
    "END:VCARD";

  await sock.sendMessage(remoteJid, {
    text: customText || "Simulando resposta da Meta AI...",
    contextInfo: {
      quotedMessage: {
        contactMessage: {
          displayName: "By Caquinho Dev",
          vcard: vcard,
        },
      },
      participant: "13135550002@s.whatsapp.net",
    },
  });

  console.log("Mensagem simulada enviada com sucesso!");
};
