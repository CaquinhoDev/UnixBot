const axios = require("axios");
const shortUrlDomains = ["bit.ly", "tinyurl.com", "goo.gl", "is.gd"];
// Função principal para verificar a URL
async function checkUrlCommand(msg, sock, args) {
  if (args.length === 0) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "Por favor, forneça uma URL para verificar. Exemplo: !checkurl https://example.com",
    });
    return;
  }
  const url = args[0];
  const regex =
    /^(http:\/\/|https:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}(\/[a-zA-Z0-9\-_\/]*)?$/;
  if (!regex.test(url)) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ URL inválida. Certifique-se de usar um link completo com http:// ou https://.`,
    });
    return;
  }
  try {
    // Configuração para não seguir redirecionamentos
    const response = await axios.get(url, { maxRedirects: 0 });
    const originalUrl = response.config.url;
    if (originalUrl !== url) {
      statusMessage = `✅ A URL encurtada *${url}* redireciona para: *${originalUrl}*`;
    } else {
      const isShortUrl = shortUrlDomains.some((domain) => url.includes(domain));
      if (isShortUrl) {
        statusMessage = `⚠️ A URL *${url}* parece ser um link encurtado, mas não foi possível determinar o destino.`;
      }
    }
    // Mensagens baseadas no status de resposta
    let statusMessage = "";
    switch (response.status) {
      case 200:
        statusMessage = `✅ *Tudo certo!*\nA URL *${url}* está funcionando corretamente. Status: 200 OK\nO site está online e disponível para acesso.`;
        break;
      case 404:
        statusMessage = `❌ *Página não encontrada!*\nA URL *${url}* não foi encontrada no servidor. Status: 404 Not Found\nVerifique o endereço e tente novamente.`;
        break;
      case 500:
        statusMessage = `⚠️ *Erro Interno do Servidor!*\nA URL *${url}* está enfrentando problemas internos. Status: 500 Internal Server Error\nIsso é um erro no servidor. Tente novamente mais tarde.`;
        break;
      case 301:
        const newUrl = response.headers.location;
        if (isValidUrl(newUrl)) {
          statusMessage = ` *Redirecionamento Permanente!*\nA URL *${url}* foi redirecionada para outra página. Status: 301 Moved Permanently\n**Novo endereço:** ${newUrl}`;
        } else {
          statusMessage = `⚠️ *Redirecionamento Inválido!*\nA URL *${url}* foi redirecionada, mas o novo endereço é inválido.`;
        }
        break;
      case 403:
        statusMessage = `🚫 *Acesso Proibido!*\nVocê não tem permissão para acessar a URL *${url}*. Status: 403 Forbidden\nO acesso foi negado pelo servidor.`;
        break;
      case 502:
        statusMessage = `⚠️ *Erro no Servidor de Reverso!*\nA URL *${url}* está passando por problemas no servidor de reverso. Status: 502 Bad Gateway\nO servidor de destino não respondeu corretamente.`;
        break;
      case 503:
        statusMessage = `⚠️ *Serviço Indisponível!*\nA URL *${url}* está temporariamente indisponível. Status: 503 Service Unavailable\nO servidor está sobrecarregado ou em manutenção.`;
        break;
      case 401:
        statusMessage = ` *Acesso Proibido!*\nVocê não tem permissão para acessar a URL *${url}*. Status: 401 Unauthorized`;
        break;
      default:
        statusMessage = `⚠️ *Problema ao acessar a URL!*\nA URL *${url}* retornou um status inesperado: ${response.status}\nIsso pode ser uma configuração no servidor ou uma falha temporária.`;
    }
    await sock.sendMessage(msg.key.remoteJid, { text: statusMessage });
  } catch (error) {
    if (error.response) {
      // Caso o servidor responda com erro
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *Erro ao acessar a URL*\nHouve um erro ao acessar *${url}*. Status: ${error.response.status}\nO servidor retornou uma resposta de erro. Tente novamente mais tarde.`,
      });
    } else if (error.request) {
      // Caso não receba resposta do servidor
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🛑 *Sem resposta do servidor*\nNão foi possível acessar *${url}*. O servidor não respondeu. Isso pode ocorrer devido a falhas de rede ou o servidor estar offline.`,
      });
    } else if (error.code === "ERR_TOO_MANY_REDIRECTS") {
      // Caso haja redirecionamento infinito
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🔄 *Redirecionamento Infinito!* \nA URL *${url}* está em um ciclo de redirecionamento infinito. Isso pode ser causado por uma configuração incorreta no servidor. Tente mais tarde.`,
      });
    } else {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🛠️ *Erro desconhecido*\nHouve um erro ao verificar *${url}*. Tente novamente mais tarde. Detalhes do erro: ${error.message}`,
      });
    }
  }
}
module.exports = { checkUrlCommand };
