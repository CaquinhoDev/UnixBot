// uptime.js
const { formatUptime, getSaudacao } = require('../utils/auth'); 

module.exports = async (msg, sock) => {
  const uptime = process.uptime() * 1000; 
  const formattedUptime = formatUptime(uptime);
  const saudacao = getSaudacao();  
  await sock.sendMessage(msg.key.remoteJid, {
    text: `${saudacao}, o bot está online há ${formattedUptime}.`
  });
};
