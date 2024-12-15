module.exports = async function handleTodos(msg, sock, args) {
  // A mensagem que o usuário quer enviar após o comando !todos
  const alert = args.join(" ").trim();

  // Se não houver mensagem após o comando, retorna um erro
  if (!alert) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Por favor, forneça uma mensagem para ser enviada a todos os participantes do grupo.",
    });
    return;
  }

  // Obtendo os dados do grupo e os participantes
  const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
  const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net"; // ID do bot
  const participants = groupMetadata.participants
    .filter((participant) => participant.id !== botJid)
    .map(({ id }) => id); // Filtrando os participantes e retirando o bot

  // Se não houver participantes no grupo, retorna um erro
  if (participants.length === 0) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Não há participantes no grupo.",
    });
    return;
  }

  // Gerando a mensagem de alerta com o spintax
  const phrase = `{📢|📣|⚠|❗|‼️} - ${alert}`;

  // Enviando a mensagem para todos os participantes do grupo
  await sendMessageWithMention(msg, sock, processSpintax(phrase), participants);

  // Logs para o desenvolvedor
  console.log(`✅ Alerta enviado a todos os participantes: ${alert}`);
};

// Função para processar o spintax (substituição aleatória de palavras dentro de chaves)
function processSpintax(text) {
  return text.replace(/\{([^}]+)\}/g, (_, group) => {
    const options = group.split("|");
    return options[Math.floor(Math.random() * options.length)];
  });
}

// Função para enviar a mensagem com mencões
async function sendMessageWithMention(msg, sock, text, participants) {
  await sock.sendMessage(msg.key.remoteJid, {
    text: `${text}\n\n`,
    mentions: participants, // Mencionando todos os participantes
  });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "📢", key: msg.key }, // Reação com o emoji 📢
  });
}
