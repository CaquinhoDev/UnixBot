module.exports = async (msg, sock) => {
  console.log("Comando 'abrir' chamado.");

  try {
    // Tenta abrir o grupo
    console.log("Tentando abrir o grupo...");
    await sock.groupSettingUpdate(msg.key.remoteJid, "not_announcement");
    await sock.sendMessage(msg.key.remoteJid, {
      text: "*O grupo foi aberto!* 🔓\n\n" + getMessageEnd(),
    });
  } catch (error) {
    console.error("Erro ao tentar abrir o grupo:", error);
    await sendErrorMessage(
      sock,
      msg,
      "*Ocorreu um erro ao tentar abrir o grupo.*"
    );
  }
};

// Função de envio de mensagem de erro
async function sendErrorMessage(sock, msg, message) {
  await sock.sendMessage(msg.key.remoteJid, {
    text: message + "\n\n" + getMessageEnd(),
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "❌", key: msg.key },
  });
}

// Função para obter o final da mensagem
function getMessageEnd() {
  return "Se precisar de ajuda, fale com o administrador!";
}
