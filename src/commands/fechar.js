module.exports = async (msg, sock) => {
  console.log("Comando 'fechar' chamado.");

  try {
    // Tenta fechar o grupo
    console.log("Tentando fechar o grupo...");
    await sock.groupSettingUpdate(msg.key.remoteJid, "announcement");
    await sock.sendMessage(msg.key.remoteJid, {
      text: "*O grupo foi fechado!* 🔒\n\n" + getMessageEnd(),
    });
  } catch (error) {
    console.error("Erro ao tentar fechar o grupo:", error);
    await sendErrorMessage(
      sock,
      msg,
      "*Ocorreu um erro ao tentar fechar o grupo.*"
    );
  }
};

async function sendErrorMessage(sock, msg, message) {
  await sock.sendMessage(msg.key.remoteJid, {
    text: message + "\n\n" + getMessageEnd(),
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "❌", key: msg.key },
  });
}

function getMessageEnd() {
  return "Se precisar de ajuda, fale com o administrador!";
}
