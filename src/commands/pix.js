require("dotenv").config(); // Carrega variáveis do arquivo .env

module.exports = async function handlePix(msg, sock) {
  // Obtém a chave Pix do arquivo .env
  const pixKey = process.env.PIX_KEY;

  // Verifica se a chave está configurada
  if (!pixKey) {
    return await sock.sendMessage(msg.key.remoteJid, {
      text: "A chave Pix não está configurada. Por favor, verifique o arquivo .env.",
    });
  }

  // Resposta formatada com a chave Pix
  const response =
    `🤖 *Ajude o bot!*\n\n` +
    `Qualquer valor é super bem-vindo e nos ajuda a cobrir os custos de desenvolvimento e manutenção.\n\n` +
    `✨ Chave Pix: ${pixKey}\n\n` +
    `Obrigado pelo apoio! 🥰`;

  // Envia a mensagem para o usuário
  return await sock.sendMessage(msg.key.remoteJid, {
    text: response,
  });
};
