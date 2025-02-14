const fs = require("fs");
const path = require("path");
const { buscarImagem } = require("../utils/image");

module.exports = async function handleImagem(msg, sock, args) {
  const keyword = args.join(" ").trim();

  if (!keyword) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "*Por favor, forneça uma palavra-chave para a busca de imagem.*",
    });
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key },
    });
    return;
  }

  try {
    const imageBuffer = await buscarImagem(keyword);

    // Caminho da pasta "temp" dentro de "src"
    const tempDir = path.join(__dirname, "temp");

    // Criar a pasta se não existir
    fs.mkdirSync(tempDir, { recursive: true });

    // Caminho do arquivo temporário
    const tempFilePath = path.join(tempDir, `temp_image_${Date.now()}.jpg`);

    fs.writeFileSync(tempFilePath, imageBuffer);

    // Enviar a imagem para o WhatsApp
    await sock.sendMessage(msg.key.remoteJid, {
      image: { url: tempFilePath },
      caption: `Imagem relacionada a "${keyword}"\n\n`,
    });

    // Apagar o arquivo temporário após o envio
    fs.unlinkSync(tempFilePath);

    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "🖼️", key: msg.key },
    });
  } catch (error) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `*Erro ao buscar a imagem:* ${error.message}\n\nVocê colocou a palavra-chave? (exemplo: planeta)`,
    });
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key },
    });
  }
};
