module.exports = async function handleSorteio(msg, sock, args) {
  const raffleName = args.join(" ").trim();
  if (!raffleName) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Por favor, informe o que será sorteado após o comando.\nExemplo: *!sorteio Playstation 5*",
    });
    return;
  }

  try {
    // Obtendo os dados do grupo e os participantes
    const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
    const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net"; // ID do bot
    const participants = groupMetadata.participants.filter(
      (participant) => participant.id !== botJid
    );

    if (participants.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Não há participantes no grupo para realizar o sorteio.",
      });
      return;
    }

    // Escolhendo um vencedor aleatório
    const winner =
      participants[Math.floor(Math.random() * participants.length)];

    // Função para processar spintax usando regex
    const processSpintax = (text) =>
      text.replace(/\{([^}]+)\}/g, (_, group) => {
        const options = group.split("|");
        return options[Math.floor(Math.random() * options.length)];
      });

    const template =
      `@${winner.id.split("@")[0]} {meus parabéns|boa}! {Você|Tu|Vc} ` +
      `{ganhou |venceu |é o vencedor d}o {sorteio|concurso} de *${raffleName}*! {🎉|🏆|🏅|🎖|🥇|⭐|✨}`;
    const responseText = processSpintax(template);

    // Enviando o resultado do sorteio
    await sock.sendMessage(msg.key.remoteJid, {
      text: responseText,
      mentions: [winner.id],
    });

    console.log(`✅ Sorteio realizado: ${raffleName} | Vencedor: ${winner.id}`);
  } catch (error) {
    console.error("Erro ao realizar o sorteio:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocorreu um erro ao realizar o sorteio. Tente novamente mais tarde.",
    });
  }
};
