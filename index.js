const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const { exec } = require("child_process");
const axios = require("axios");
const math = require("mathjs"); // Importando a biblioteca mathjs

const PREFIX = "!";
const SIMI_API_URL = "https://api.simsimi.vn/v1/simtalk"; // URL da API SimSimi

let botStartTime = Date.now(); // Timestamp inicial para uptime

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "Connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("Opened connection");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text || !text.startsWith(PREFIX)) return;

    const command = text.slice(PREFIX.length).trim().toLowerCase();
    const timestampSent = Date.now(); // Timestamp do envio da mensagem

    // Comando de ping com reação
    if (command === "ping") {
      const timestampReceived = Date.now(); // Timestamp do recebimento da resposta
      const latency = timestampReceived / timestampSent; // Latência em ms

      await sock.sendMessage(msg.key.remoteJid, {
        text: `Pong! 🏓\n\n⏳ Tempo de resposta do bot foi de *${latency}ms*.\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🏓", key: msg.key },
      });
      return;
    }

    // Comando de cálculo usando mathjs
    if (command.startsWith("calcular")) {
      const expression = text.slice(PREFIX.length + 9).trim(); // Remove PREFIX e 'calcular'

      try {
        const result = math.evaluate(expression);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Resultado: ${result}\n\n${getMessageEnd()}`,
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Erro ao calcular a expressão: ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
      }
      return;
    }

    // Comando para abrir aplicativos no Windows
    if (command.startsWith("abrir")) {
      const app = command.split(" ")[1];
      exec(app, (err) => {
        if (err) {
          sock.sendMessage(msg.key.remoteJid, {
            text: `Erro ao abrir ${app}: ${err.message}\n\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: `${app} foi aberto com sucesso! 🎉\n\n${getMessageEnd()}`,
          });
        }
      });
      return;
    }

    // Comando para desligar o computador
    if (command === "desligar") {
      exec("shutdown /s /f /t 0", (err) => {
        if (err) {
          sock.sendMessage(msg.key.remoteJid, {
            text: `Erro ao desligar o computador: ${
              err.message
            }\n\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "Computador será desligado! 💻🔌\n\n" + getMessageEnd(),
          });
        }
      });
      return;
    }

    // Comando para reiniciar o computador
    if (command === "reiniciar") {
      exec("shutdown /r /f /t 0", (err) => {
        if (err) {
          sock.sendMessage(msg.key.remoteJid, {
            text: `Erro ao reiniciar o computador: ${
              err.message
            }\n\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "Computador será reiniciado! 🔄\n\n" + getMessageEnd(),
          });
        }
      });
      return;
    }

    // Comando SimSimi
    if (command.startsWith("simi")) {
      const message = command.slice(4).trim();
      if (!message) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Por favor, forneça uma mensagem para o SimSimi.\n\n${getMessageEnd()}`,
        });
        return;
      }

      try {
        const response = await axios.post(SIMI_API_URL, {
          text: message,
          lc: "pt", // Língua portuguesa
        });

        // Responde com a mensagem da API SimSimi, independentemente do status
        const responseText =
          response.data.success || "Resposta não encontrada.";

        await sock.sendMessage(msg.key.remoteJid, {
          text: responseText + `\n\n${getMessageEnd()}`,
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Erro ao se comunicar com a API SimSimi: ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
      }
      return;
    }

    const userId = msg.key.participant || msg.key.remoteJid;
    // Comando de menu
    if (command === "menu") {
      const menu = `༒W̷E̷L̷C̷O̷M̷E̷༒
    『 𝐌𝐄𝐍𝐔 』
  ╭════════════════════╯
   | ೈ፝͜͡🤑 !calcular
   | ೈ፝͜͡🤑 !simi 
   | ೈ፝͜͡🤑 !desligar
   | ೈ፝͜͡🤑 !reinciar
   | ೈ፝͜͡🤑 !uptime
   | ೈ፝͜͡🤑 !ping
  ╰════════════════════╮
  `;

      await sock.sendMessage(msg.key.remoteJid, {
        text: menu + `\n\n${getMessageEnd()}`,
      });
      return;
    }

    // Comando de uptime
    if (command === "uptime") {
      const uptime = formatUptime(Date.now() - botStartTime);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `O bot está online há ${uptime}.\n\n${getMessageEnd()}`,
      });
      return;
    }

    // Resposta padrão se o comando não for reconhecido
    await sock.sendMessage(msg.key.remoteJid, {
      text: `Comando não reconhecido. Tente novamente.\n\n${getMessageEnd()}`,
    });
  });
}

// Função para formatar o tempo de atividade
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return `*${days} dias, ${hours % 24} horas, ${minutes % 60} minutos e ${
    seconds % 60
  } segundos*`;
}

// Função para adicionar a mensagem personalizada no final de cada resposta
function getMessageEnd() {
  return "ミ★ MagoBot JS 1.0 ★彡";
}

startBot();
