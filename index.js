const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const { exec } = require("child_process");
const axios = require("axios");
const math = require("mathjs"); // Importando a biblioteca mathjs

const PREFIX = "!";

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

    // Comando de ping com reação
    if (command === "ping") {
      const timestampReceived = Date.now(); // Timestamp do recebimento da resposta
      const latency = timestampReceived - timestampSent; // Latência em ms

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
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "🧮", key: msg.key },
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Erro ao calcular a expressão: ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key },
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
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key },
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: `${app} foi aberto com sucesso! 🎉\n\n${getMessageEnd()}`,
          });
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🎉", key: msg.key },
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
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key },
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "Computador será desligado! 💻🔌\n\n" + getMessageEnd(),
          });
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "💻", key: msg.key },
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
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key },
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "Computador será reiniciado! 🔄\n\n" + getMessageEnd(),
          });
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🔄", key: msg.key },
          });
        }
      });
      return;
    }

    // Função para obter resposta do SimSimi
    async function getSimSimiResponse(query) {
      let data = new FormData();
      data.append("lc", "pt");
      data.append("key", ""); // Substitua esse vazio pela sua chave da API SimSimi caso seja necessário!
      data.append("text", query);

      let config = {
        method: "post",
        url: "https://api.simsimi.vn/v1/simtalk",
        headers: {
          ...data.getHeaders(),
        },
        data: data,
      };

      try {
        const response = await axios.request(config);

        // Verifica se o status é diferente de 200
        if (response.status !== 200) {
          console.error("Error:", response.statusText);
        }

        // Verifica se a resposta contém a mensagem
        if (
          response.data &&
          response.data.message &&
          response.data.message !== ""
        ) {
          return response.data.message;
        } else {
          console.error("Error: No valid response message found.");
          return "Desculpe, não consegui entender sua mensagem."; // Mensagem padrão caso não encontre uma resposta válida
        }
      } catch (error) {
        // Verifica se o erro contém uma resposta com uma mensagem
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          console.log(JSON.stringify(error.response.data)); // Exibir a resposta de erro completa da API
          return error.response.data.message;
        }

        console.error("Error:", error);
        return "Desculpe, houve um erro ao processar sua mensagem."; // Mensagem padrão para outros erros
      }
    }

    // Integrando a função no comando simi
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

      // Comando SimSimi
      if (command.startsWith("simi")) {
        const message = text.slice(PREFIX.length + 4).trim();
        if (!message) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `Por favor, forneça uma mensagem para o SimSimi.\n\n${getMessageEnd()}`,
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
            text: `Erro ao se comunicar com a API SimSimi: ${
              error.message
            }\n\n${getMessageEnd()}`,
          });
        }
        return;
      }

      // ... outros comandos
    });

    // Comando de menu
    if (command === "menu") {
      const menu = `༒W̷E̷L̷C̷O̷M̷E̷༒
        『 𝐌𝐄𝐍𝐔 』
      ╭════════════════════╯
       | ೈ፝͜͡🤑 !calcular
       | ೈ፝͜͡🤑 !simi 
       | ೈ፝͜͡🤑 !desligar
       | ೈ፝͜͡🤑 !reiniciar
       | ೈ፝͜͡🤑 !criador 
       | ೈ፝͜͡🤑 !dono
       | ೈ፝͜͡🤑 !info
       | ೈ፝͜͡🤑 !uptime
       | ೈ፝͜͡🤑 !ping
      ╰════════════════════╮`;

      await sock.sendMessage(msg.key.remoteJid, {
        text: menu + `\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "📜", key: msg.key },
      });
      return;
    }

    // Comando de uptime
    if (command === "uptime") {
      const uptime = formatUptime(Date.now() - botStartTime);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `O bot está online há *${uptime}*.\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "⏳", key: msg.key },
      });
      return;
    }

    // Comando de criador
    if (command === "criador") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "Eu sou o bot criado por *Pedro Henrique*, vulgo *Caquinho Dev*. 👨‍💻\n\n" +
          getMessageEnd(),
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "👨‍💻", key: msg.key },
      });
      return;
    }

    // Comando de dono
    if (command === "dono") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "O dono do bot é *Pedro Henrique*. 👑\n\n" + getMessageEnd(),
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "👑", key: msg.key },
      });
      return;
    }

    // Comando de info
    if (command === "info") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Informações sobre o bot:\n\n- *Bot: MagoBot\n- Versão: 1.0.0\n- Criador: Pedro Henrique*\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "ℹ️", key: msg.key },
      });
      return;
    }

    const nomes = ["pedro", "pedro henrique", "caquinho"]; // Lista de nomes para verificar

    if (nomes.some((nome) => text.toLowerCase().includes(nome))) {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "O que você está falando do meu criador?? 🤨\n\n" + getMessageEnd(),
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🤨", key: msg.key },
      });
      return;
    }

    // Comando não reconhecido
    await sock.sendMessage(msg.key.remoteJid, {
      text: `Comando não reconhecido. Use !menu para ver a lista de comandos disponíveis.\n\n${getMessageEnd()}`,
    });
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "❓", key: msg.key },
    });
  });

  function normalizeCommand(command) {
    return command.replace(/\s+/g, " ").trim(); // Remove espaços extras
  }

  function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  }

  function getMessageEnd() {
    return "ミ★ MagoBot JS 1.0 ★彡";
  }
}

startBot();
