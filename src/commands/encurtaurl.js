const { encurtarUrlIsgd } = require("../utils/encurtaurl-api");
module.exports = async (msg, sock, url) => {
  console.log("Comando !encurtaurl detectado");
  // Verifica se a URL está vazia ou inválida
  console.log("URL a ser encurtaDa:", url);
  // Chama a função encurtarUrlIsgd
  const urlCurta = await encurtarUrlIsgd(url);
  // Envia a resposta conforme a URL encurtada
  console.log("Estamos dentro da funcao de encurtarurl!");
  if (urlCurta) {
    console.log("URL encurtada com sucesso:", urlCurta);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Aqui está a sua URL encurtada: ${urlCurta}`,
    });
  } else {
    console.log("Falha ao encurtar a URL.");
    await sock.sendMessage(msg.key.remoteJid, {
      text: "🛠️ Não foi possível encurtar a URL. Tente novamente mais tarde.",
    });
  }
};
