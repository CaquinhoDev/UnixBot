const {
  areJidsSameUser,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

module.exports = async function handleBan(msg, sock, args, group) {
  const kickedUsers = msg.message.extendedTextMessage
    ? msg.message.extendedTextMessage.contextInfo.mentionedJid || []
    : args.filter((jid) => /^\d{10,13}@s\.whatsapp\.net$/.test(jid));

  if (!kickedUsers || kickedUsers.length < 1) {
    return await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠ O número a ser removido não foi encontrado. Mencione alguém ou cite uma mensagem!",
    });
  }

  if (!group)
    return await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key },
    });

  const clientJid = jidNormalizedUser(sock.user?.id);
  for (const user of kickedUsers) {
    // Verifica se o usuário está no grupo
    const isMember = group.participants.some((p) =>
      areJidsSameUser(p.id, user)
    );
    const isMe = areJidsSameUser(user, clientJid);
    const hisSelf = areJidsSameUser(user, msg.key.participant);

    if (isMe || hisSelf) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠ Você não pode se remover ou me remover!",
      });
    }

    if (!isMember) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠ O número a ser removido não está no grupo!",
      });
    }

    try {
      // Remove o usuário do grupo
      const response = await sock.groupParticipantsUpdate(
        group.id,
        [user],
        "remove"
      );
      if (response[0].status === "200") {
        // Bloqueia o usuário após a remoção
        await sock.updateBlockStatus(user, "block");

        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ Usuário removido e bloqueado com sucesso! @${
            user.split("@")[0]
          }`,
          mentions: [user],
        });
      } else {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "⚠ Não foi possível remover o usuário.",
        });
      }
    } catch (error) {
      console.error("Erro ao remover/bloquear o usuário:", error.message);
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠ Ocorreu um erro ao tentar remover ou bloquear o usuário.",
      });
    }
  }
};
