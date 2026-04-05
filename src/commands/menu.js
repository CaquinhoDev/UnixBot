module.exports = async function handleMenu(msg, sock) {
  const menu = `✨ 𝐌𝐄𝐍𝐔 ✨

  
💸 !calcular    
🤖 !simi        
⏱️ !uptime      
⚡ !ping         
👑 !dono        
🛠️ !criador     
ℹ️ !info        
🤖 !gpt         
🔒 !fechar (admin)
🔓 !abrir (admin) 
📝 !menu        
📸 !imagem      
📸 !revelar
📞 !ddd         
🎉 !sorteio     
😂 !piada       
🎁 !convite     
💳 !pix         
🔗 !checkurl    
🌐 !encurtaurl  
📰 !noticias    
👥 !todos       
🌍 !traduzir    
🎲 !dado        
🪙 !moeda       
🔮 !adivinha    
🔍 !pesquisar   


🚨 Para fazer figurinha, basta mandar uma mensagem de foto contendo no titulo !s !sticker ou !figurinha
`;

  await sendMessageWithReaction(msg, sock, menu, "📜");
};

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}` });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: emoji, key: msg.key },
  });
}
