/*module.exports = async function handleBan(msg, sock, args, isGroup, isGroupAdmins, isBotGroupAdmins, isOwner, groupMembers, botNumber, isAllOwner, vip, blackmd, enviar, menc_os2, sleep) {
  try {
      // Reagir com ✅
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

      if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: enviar.msg.grupo });
      if (!isGroupAdmins) return sock.sendMessage(msg.key.remoteJid, { text: enviar.msg.adm });
      if (!isBotGroupAdmins) return sock.sendMessage(msg.key.remoteJid, { text: enviar.msg.Badmin });
      if (!menc_os2) return sock.sendMessage(msg.key.remoteJid, { text: "Marque o usuário que você deseja banir do grupo, a mensagem ou o @" });

      // A pessoa não está no grupo
      if (!JSON.stringify(groupMembers).includes(menc_os2)) {
          return sock.sendMessage(msg.key.remoteJid, { text: "Esse usuário não se encontra mais no grupo..." });
      }

      // Marcaram o @ do bot
      if (botNumber.includes(menc_os2)) {
          if (!isOwner) {
              await sock.sendMessage(msg.key.remoteJid, { text: "Aplicando punição pq tentaram me banir... Cê tem sorte de só perder o ADM" });
              return blackmd.groupParticipantsUpdate(msg.key.remoteJid, [msg.key.participant], "demote");
          } else {
              return sock.sendMessage(msg.key.remoteJid, { text: "Qual foi patrão ?" });
          }
      }

      

      

      // Não é VIP nem dono
      await sock.sendMessage(msg.key.remoteJid, { 
          audio: { url: './database/audios/ban.m4a' }, 
          mimetype: 'audio/mp4', 
          ptt: true 
      }, { quoted: msg });

      await sock.groupParticipantsUpdate(msg.key.remoteJid, [menc_os2], "remove");

      return sock.sendMessage(msg.key.remoteJid, { 
          text: `*USUÁRIO* @${menc_os2.split("@")[0]} *FOI REMOVIDO COM SUCESSO* 😎👍🏽`, 
          mentions: [menc_os2] 
      });

  } catch (error) {
      console.error("Erro ao processar o comando de ban:", error);
  }
};


if (!isGroup) {
    if (!isGroupAdmins && !m.isCreator) return sock.sendMessage(from, { text: 'Somente administradores podem usar esse comando!' });
    let usuario = message.mentionedJid[0] || message.quoted.sender;
    if (!usuario) return sock.sendMessage(from, { text: 'Você precisa mencionar ou responder a uma mensagem de alguém para dar ban!' });
    await sock.groupParticipantsUpdate(from, [usuario], "remove");
    //await sock.groupParticipantsUpdate(from, [usuario], "add");
    sock.sendMessage(from, { text: `Usuário ${usuario} foi banido do grupo!` });
    await sock.sendMessage(from, { 
          audio: { url: './database/audios/ban.m4a' }, 
          mimetype: 'audio/mp4', 
          ptt: true 
      }, { quoted: message });
  } else {
    sock.sendMessage(from, { text: 'Esse comando só funciona em grupos!' });
  }



  case 'bann':
if(!SoDono) return reply("Só usuário premium pode utilizar este comando..") 
if(!isBotGroupAdmins) return reply(Res_BotADM)
if(!menc_os2 || menc_jid2[1]) return reply("Marque a mensagem do usuário ou marque o @ dele.., lembre de só marcar um usuário...")
if(!JSON.stringify(groupMembers).includes(menc_os2)) return reply("Este usuário já foi removido ou saiu do grupo.")
if(premium.includes(menc_os2)) return mentions(`@${menc_os2.split("@")[0]} a(o) @${sender.split("@")[0]} está querendo banir você, visualiza esse problema ae 😶`, [menc_os2], true)
if(groupAdmins.includes(menc_os2)) return mentions(`@${menc_os2.split("@")[0]} a(o) @${sender.split("@")[0]} está querendo banir você, visualiza esse problema ae 😶`, [menc_os2], true)
if(botNumber.includes(menc_os2)) return reply('Não sou besta de remover eu mesmo né 🙁, mas estou decepcionado com você')
if(numerodono.includes(menc_os2)) return reply('Não posso remover meu dono 🤧')
conn.sendMessage(from, {text: `@${menc_os2.split("@")[0]} Foi [ REMOVIDO(A) COM SUCESSO ] - (Por motivos ainda não esclarecidos) -`, mentions: [menc_os2]})
conn.groupParticipantsUpdate(from, [menc_os2], "remove")  
break*/

module.exports = async function handleBan(message, sock, from) {
  const groupMetadata = await sock.groupMetadata(from);
  const groupAdmins = groupMetadata.participants
    .filter((p) => p.admin)
    .map((p) => p.id);
  const sender = message.key.participant || from;

  if (!groupAdmins.includes(sender)) {
    await sock.sendMessage(from, {
      text: "❌ Você precisa ser administrador para usar este comando.",
    });
    return;
  }

  const mentionedJid =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const quotedJid =
    message.message?.extendedTextMessage?.contextInfo?.participant;
  const target = mentionedJid || quotedJid;

  if (!target) {
    await sock.sendMessage(from, {
      text: "❌ *Marque a mensagem ou mencione quem você quer banir.*",
    });
    return;
  }

  try {
    await sock.groupParticipantsUpdate(from, [target], "remove");

    await sock.sendMessage(from, {
      text: `✅ *Usuário removido com sucesso.*`,
    });
    await sock.sendMessage(
      from,
      {
        audio: { url: "./database/audios/ban.m4a" },
        mimetype: "audio/mp4",
        ptt: true,
      },
      { quoted: message }
    );
  } catch (err) {
    console.error(err);
    await sock.sendMessage(from, {
      text: "❌ *Não foi possível remover o usuário. caso você seja meu dono, vcrifique os registros.*",
    });
  }
};
