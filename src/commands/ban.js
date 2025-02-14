module.exports = async function handleBan(msg, sock, args) {
  try {
    // Verifica se a mensagem foi enviada em um grupo
    if (!msg.key.remoteJid.endsWith("@g.us")) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Este comando só pode ser usado em grupos!",
      });
    }

    // Verifica se o usuário forneceu um número para banir
    if (!args[0]) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Uso incorreto! Digite: *!ban @usuario*",
      });
    }

    // Obtém o ID do usuário mencionado (formato: @551234567890)
    let mentionedUser = args[0].replace(/[@\s]/g, "") + "@s.whatsapp.net";

    // Obtém a lista de participantes do grupo
    const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
    const participants = groupMetadata.participants;

    // Verifica se o bot é administrador
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const botIsAdmin = participants.some((p) => p.id === botNumber && p.admin);

    if (!botIsAdmin) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "🚫 Eu preciso ser administrador para banir usuários!",
      });
    }

    // Verifica se o usuário mencionado está no grupo
    const userExists = participants.some((p) => p.id === mentionedUser);
    if (!userExists) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ O usuário mencionado não está no grupo!",
      });
    }

    // Expulsa o usuário do grupo
    await sock.groupParticipantsUpdate(
      msg.key.remoteJid,
      [mentionedUser],
      "remove"
    );

    // Envia mensagem confirmando o banimento
    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ O usuário @${args[0].replace(
        /[@\s]/g,
        ""
      )} foi banido com sucesso!`,
      mentions: [mentionedUser],
    });
  } catch (error) {
    console.error("Erro ao executar o comando de ban:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocorreu um erro ao tentar banir o usuário!",
    });
  }
};
