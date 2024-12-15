module.exports = async function handleRegras(msg, sock, group) {
  try {
    // Verifica se a mensagem foi enviada em um grupo
    if (!group) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠ Este comando só pode ser usado em grupos.",
      });
    }

    // Obtém a descrição do grupo
    const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
    const description =
      groupMetadata.desc || "Nenhuma descrição foi definida para este grupo.";

    const response = `📜 *Regras do Grupo ${groupMetadata.subject}:*\n\n${description}`;
    await sock.sendMessage(msg.key.remoteJid, { text: response });
  } catch (error) {
    console.error("Erro ao obter a descrição do grupo:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "¯\\_(ツ)_/¯",
    });
  }
};
