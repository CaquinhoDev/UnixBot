module.exports = async function handleConvite(msg, sock) {
  try {
    // Obtém o ID do grupo
    const groupId = msg.key.remoteJid;

    // Verifica se a mensagem é de um grupo
    if (!groupId.endsWith("@g.us")) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠ Este comando só pode ser usado em grupos.",
      });
    }

    // Gera o link de convite do grupo
    const inviteLink = await sock.groupInviteCode(groupId);

    // Envia o link de convite
    await sock.sendMessage(msg.key.remoteJid, {
      text: `📩 Aqui está o link de convite para este grupo:\n\nhttps://chat.whatsapp.com/${inviteLink}`,
    });
  } catch (error) {
    console.error("Erro ao gerar o link de convite:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠ Ocorreu um erro ao gerar o link de convite. Certifique-se de que eu tenha permissões de administrador no grupo.",
    });
  }
};
