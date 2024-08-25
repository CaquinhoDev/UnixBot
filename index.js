require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env
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

// Obtendo o número de telefone do dono do arquivo .env
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER;

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

    const command = normalizeCommand(
      text.slice(PREFIX.length).trim().toLowerCase()
    );
    const timestampSent = Date.now(); // Timestamp do envio da mensagem

    // Função para verificar se o usuário é o dono
    const isOwner = msg.key.remoteJid === OWNER_PHONE_NUMBER;

    // Comando de ping com reação
    if (command === "ping") {
      const timestampReceived = Date.now(); // Timestamp do recebimento da resposta
      const latency = timestampReceived - timestampSent; // Latência em ms

      await sock.sendMessage(msg.key.remoteJid, {
        text: `*Pong!* 🏓\n\n⏳ *Tempo de resposta do bot foi de ${latency}ms*.\n\n${getMessageEnd()}`,
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
          text: `*Resultado:* ${result}\n\n${getMessageEnd()}`,
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Erro ao calcular a expressão:* ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
      }
      return;
    }

    // Comando para abrir aplicativos no Windows (restrito ao dono)
    if (command.startsWith("abrir")) {
      if (!isOwner) {
        await sock.sendMessage(msg.key.remoteJid, {
          text:
            "*Você não tem permissão para usar este comando.*\n\n" +
            getMessageEnd(),
        });
        return;
      }
      const app = command.split(" ")[1];
      exec(app, (err) => {
        if (err) {
          sock.sendMessage(msg.key.remoteJid, {
            text: `*Erro ao abrir ${app}:* ${
              err.message
            }\n\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: `${app} *foi aberto com sucesso!* 🎉\n\n${getMessageEnd()}`,
          });
        }
      });
      return;
    }

    // Comando para desligar o computador (restrito ao dono)
    if (command === "desligar") {
      if (!isOwner) {
        await sock.sendMessage(msg.key.remoteJid, {
          text:
            "*Você não tem permissão para usar este comando.*\n\n" +
            getMessageEnd(),
        });
        return;
      }
      exec("shutdown /s /f /t 0", (err) => {
        if (err) {
          sock.sendMessage(msg.key.remoteJid, {
            text: `*Erro ao desligar o computador:* ${
              err.message
            }\n\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "*Computador será desligado!* 💻🔌\n\n" + getMessageEnd(),
          });
        }
      });
      return;
    }

    // Comando para reiniciar o computador (restrito ao dono)
    if (command === "reiniciar") {
      if (!isOwner) {
        await sock.sendMessage(msg.key.remoteJid, {
          text:
            "*Você não tem permissão para usar este comando.*\n\n" +
            getMessageEnd(),
        });
        return;
      }
      exec("shutdown /r /f /t 0", (err) => {
        if (err) {
          sock.sendMessage(msg.key.remoteJid, {
            text: `*Erro ao reiniciar o computador:* ${
              err.message
            }\n\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "*Computador será reiniciado!* 🔄\n\n" + getMessageEnd(),
          });
        }
      });
      return;
    }

    // Comando SimSimi
    if (command.startsWith("simi")) {
      const message = text.slice(PREFIX.length + 4).trim();
      if (!message) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Por favor, forneça uma mensagem para o SimSimi.*\n\n${getMessageEnd()}`,
        });
        return;
      }

      try {
        const responseText = await getSimSimiResponse(message);

        await sock.sendMessage(msg.key.remoteJid, {
          text: responseText + `\n\n${getMessageEnd()}`,
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Erro ao se comunicar com a API SimSimi:* ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
      }
      return;
    }

    // Comando de menu
    if (command === "menu") {
      const menu = `*༒W̷E̷L̷C̷O̷M̷E̷༒*
      『 *𝐌𝐄𝐍𝐔* 』
      ╭════════════════════╯
       | *🤑 !calcular*
       | *🤑 !simi* 
       | *🤑 !desligar*
       | *🤑 !reiniciar*
       | *🤑 !criador* 
       | *🤑 !dono*
       | *🤑 !info*
       | *🤑 !uptime*
       | *🤑 !ping*
      ╰════════════════════╮`;

      await sock.sendMessage(msg.key.remoteJid, {
        text: menu + `\n\n${getMessageEnd()}`,
      });
      return;
    }

    // Comando de uptime
    if (command === "uptime") {
      const uptime = formatUptime(Date.now() - botStartTime);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `*O bot está online há ${uptime}.*\n\n${getMessageEnd()}`,
      });
      return;
    }

    // Comando de criador
    if (command === "criador") {
      const creatorInfo = `*Pedro Henrique, vulgo Caquinho Zinho*\n\n*GitHub:* https://github.com/caquinhodev`;
      await sock.sendMessage(msg.key.remoteJid, {
        text: creatorInfo + `\n\n${getMessageEnd()}`,
      });
      return;
    }

    // Comando de dono
    if (command === "dono") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `*O dono do bot é Pedro Henrique (Caquinho Zinho).* \n*Número:* ${OWNER_PHONE_NUMBER}\n\n${getMessageEnd()}`,
      });
      return;
    }
  });
}

function normalizeCommand(command) {
  return command.trim().toLowerCase();
}

function formatUptime(uptime) {
  const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
  const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((uptime % (60 * 1000)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getMessageEnd() {
  return "ミ★ *MagoBot JS 1.0* ★彡";
}

async function getSimSimiResponse(message) {
  const response = await axios.post(SIMI_API_URL, {
    lc: "pt",
    text: message,
  });
  return response.data.response;
}

const OWNER_NAME_VARIANTS = [
  "Pedro",
  "Pedro Henrique",
  "Caquinho",
  "Caquinho Zinho",
];

function handleNameMention(message, sock, from) {
  // Verifica se a mensagem contém alguma variação do seu nome
  const containsOwnerName = OWNER_NAME_VARIANTS.some((name) =>
    message.toLowerCase().includes(name.toLowerCase())
  );

  if (containsOwnerName) {
    sock.sendMessage(from, {
      text: "*O que você está falando do meu criador?? 🤨*",
    });
  }
}

startBot();
