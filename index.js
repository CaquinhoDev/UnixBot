const {
  default: makeWASocket,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const { exec } = require("child_process");

const PREFIX = "!";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect.error?.output?.statusCode !==
          DisconnectReason.loggedOut;
        console.log(
          "Connection closed due to ",
          lastDisconnect.error,
          ", reconnecting ",
          shouldReconnect
        );
        // Reconnect if not logged out
        if (shouldReconnect) {
          startBot();
        }
      } else if (connection === "open") {
        console.log("Opened connection");
      }
    });

    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text || !text.startsWith(PREFIX)) return;

    const command = text.slice(PREFIX.length).trim().toLowerCase();

    const time = msg.messageTimestamp;
    const ms = Date.now() - time * 1000;

    //COMANDOS

    // Comando de ping com reação
    if (command === "ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Pong! 🏓\n\n⏳ Tempo de resposta do bot foi de *${ms}ms*.\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🏓", key: msg.key },
      });
      return;
    }

    // Comando de cálculo
    if (command === "calcular") {
      const [_, operation, num1, num2] = text.split(" ");
      let result;

      switch (operation) {
        case "soma":
          result = parseFloat(num1) + parseFloat(num2);
          break;
        case "subtrai":
          result = parseFloat(num1) - parseFloat(num2);
          break;
        case "multiplica":
          result = parseFloat(num1) * parseFloat(num2);
          break;
        case "divide":
          result = parseFloat(num1) / parseFloat(num2);
          break;
        default:
          result = "Operação não reconhecida";
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: `Resultado: ${result}\n${getMessageEnd()}`,
      });
      return;
    }

    // Comando para abrir aplicativos no Windows
    if (command === "abrir") {
      const app = text.split(" ")[1];
      exec(app, (err) => {
        if (err) {
          sock.sendMessage(msg.key.remoteJid, {
            text: `Erro ao abrir ${app}: ${err.message}\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: `${app} foi aberto com sucesso!\n${getMessageEnd()}`,
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
            }\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "Computador será desligado!\n" + getMessageEnd(),
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
            }\n${getMessageEnd()}`,
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "Computador será reiniciado!\n" + getMessageEnd(),
          });
        }
      });
      return;
    }

    // Resposta padrão se o comando não for reconhecido
    sock.sendMessage(msg.key.remoteJid, {
      text: `Comando não reconhecido.\n${getMessageEnd()}`,
    });
  });
}

// Função para adicionar a mensagem personalizada no final de cada resposta
function getMessageEnd() {
  return "ミ★ MagoBot JS 1.0 ★彡";
}

startBot();
