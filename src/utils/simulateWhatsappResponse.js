// src/utils/simulateWhatsappResponse.js
module.exports = async function simulateWhatsappResponse(
  sock,
  remoteJid,
  customText
) {
  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "FN:Whatsapp\n" +
    "ORG:By Caquinho Dev;\n" +
    "TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\n" +
    "END:VCARD";

  await sock.sendMessage(remoteJid, {
    text: customText || "Caquinho Domina!",
    contextInfo: {
      quotedMessage: {
        contactMessage: {
          displayName: "By Pedro 😎",
          vcard: vcard,
        },
      },
      participant: "0@s.whatsapp.net",
    },
  });

  console.log("Mensagem simulada enviada com sucesso!");
};
