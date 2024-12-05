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

function getSaudacao() {
  let hour = new Date().getHours();
  hour -= 3;
  if (hour < 0) {
    hour += 24; 
  }

  console.log("Hora corrigida do sistema:", hour);

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

module.exports = { formatUptime, getSaudacao };
