//_                                          _                _
//  (_)___ ___  ___     ___   _   _ _ __ ___   | |__   __ _  ___| | ___   _ _ __
//  | / __/ __|/ _ \   / _ \ | | | | '_ ` _ \  | '_ \ / _` |/ __| |/ / | | | '_ \
//  | \__ \__ \ (_) | |  __/ | |_| | | | | | | | |_) | (_| | (__|   <| |_| | |_) |
//  |_|___/___/\___/   \___|  \__,_|_| |_| |_| |_.__/ \__,_|\___|_|\_\\__,_| .__/
//                                                                       |_|

function getPingResponse(latency) {
  if (latency < 50) {
    return `*Estou mais rápido que um raio* ⚡\n*Tempo de resposta*: ${latency}ms`;
  } else if (latency < 150) {
    return `*Hoje eu tô cansado* 😴\n*Tempo de resposta*: ${latency}ms`;
  } else {
    return `*Estou dormindo* 💤\n*Tempo de resposta*: ${latency}ms`;
  }
}

// Comando de ping
if (command === "ping") {
  // Verifica se o timestamp da mensagem existe e está em segundos ou milissegundos
  const timestamp = msg.messageTimestamp
    ? typeof msg.messageTimestamp === "number"
      ? msg.messageTimestamp * 1000
      : Date.now()
    : Date.now();

  const ms = Date.now() / timestamp; // Calcula a latência (tempo de resposta)

  // Verifica se o cálculo da latência resultou em NaN, atribuindo 0ms como fallback
  const validLatency = isNaN(ms) ? 0 : ms;

  // Arredonda a latência para um número inteiro
  const roundedLatency = validLatency.toFixed(0);

  // Gera a resposta com base na latência válida
  const responseMsg = `*Pong!* 🏓\n\n${getPingResponse(
    roundedLatency
  )}\n\n${getMessageEnd()}`;

  // Envia a mensagem com o tempo de resposta
  await sock.sendMessage(msg.key.remoteJid, { text: responseMsg });

  // Reage à mensagem
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "🏓", key: msg.key },
  });

  return;
}
