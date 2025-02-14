function formatUptime(ms) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  hours %= 24;
  minutes %= 60;
  seconds %= 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getSaudacao(nome) {
  let hour = new Date().getHours(); // Usa a hora do sistema sem modificações
  console.log("Hora atual do sistema:", hour);

  if (hour < 12) return `Bom dia, ${nome}`;
  if (hour < 18) return `Boa tarde, ${nome}`;
  return `Boa noite, ${nome}`;
}

module.exports = { formatUptime, getSaudacao };
