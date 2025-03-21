require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const { exec } = require("child_process");
const { buscarImagem } = require("./unsplash");
const axios = require("axios");
const FormData = require("form-data");
const math = require("mathjs"); // Importando a biblioteca mathjs
const translate = require("@vitalets/google-translate-api");
const fs = require("fs");
const PREFIX = "!";
const pino = require("pino");
const SIMI_API_URL = "https://api.simsimi.vn/v1/simtalk"; // URL da API SimSimi

// Obtendo o número de telefone do dono do arquivo .env
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER;

let botStartTime = Date.now(); // Timestamp inicial para uptime

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
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

    const messageContent =
      msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    // const command = messageContent.split(" ")[0].toLowerCase().substring(1);
    const args = messageContent.split(" ").slice(1);

    // Verifica se o bot é administrador
    const isAdmin = msg.key.participant ? true : false; // Adapte isso conforme necessário

    // Função para gerar uma resposta criativa com base na latência
    if (command === "ping") {
      const start = Date.now();
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "🏓 Pong! Calculando o tempo de resposta...\n\n" + getMessageEnd(),
      });
      const end = Date.now();
      const ping = end - start;

      await sock.sendMessage(msg.key.remoteJid, {
        text: `📶 Tempo de resposta: ${ping}ms\n\n` + getMessageEnd(),
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
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "📊", key: msg.key }, // Reação para cálculo
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Erro ao calcular a expressão:* ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key }, // Reação de erro para cálculo
        });
      }
      return;
    }

    // Comando de criador
    if (command === "criador") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "Eu sou um bot criado por *Pedro Henrique*, vulgo *Caquinho Dev*. 👨‍💻\n\n" +
          getMessageEnd(),
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "👨‍💻", key: msg.key },
      });
      return;
    }

    // Comando de menu
    if (command === "menu") {
      const menu = `༒W̷E̷L̷C̷O̷M̷E̷༒
      『 𝐌𝐄𝐍𝐔 』
    ╭════════════════════╯
    | ೈ፝͜͡🤑 !calcular
    | ೈ፝͜͡🤑 !simi 
    | ೈ፝͜͡🤑 !uptime
    | ೈ፝͜͡🤑 !ping
    | ೈ፝͜͡🤑 !dono
    | ೈ፝͜͡🤑 !criador
    | ೈ፝͜͡🤑 !info
    | ೈ፝͜͡🤑 !gpt (IA)
    | ೈ፝͜͡🤑 !fechar (admin)
    | ೈ፝͜͡🤑 !abrir (admin)
    | ೈ፝͜͡🤑 !menu
    | ೈ፝͜͡🤑 !imagem
    | ೈ፝͜͡🤑 !dado
    | ೈ፝͜͡🤑 !moeda
    | ೈ፝͜͡🤑 !adivinha
    | ೈ፝͜͡🤑 !pesquisar
    ╰════════════════════╮
      `;
      await sock.sendMessage(msg.key.remoteJid, {
        text: menu + `\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "📜", key: msg.key },
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

    // Função para fazer a requisição à API Gemini
    async function getGeminiResponse(query) {
      const prompt = {
        contents: [
          {
            parts: [
              {
                text: `You are an AI model named Gemini. Mention that this bot was created by Pedro Henrique, 
                but avoid repeating it too much. Be friendly and avoid using overly complex words. Try to keep the user engaged by asking interesting questions or interacting with them.
                Format your response for WhatsApp, so use a single '*' for emphasis. Always answer most questions in Portuguese, unless you identify that the person is speaking another language. Now, respond to the following message, ignoring the prefix "!gpt": "${query}"`,
              },
            ],
          },
        ],
      };

      let config = {
        method: "post",
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI}`,
        headers: {
          "Content-Type": "application/json",
        },
        data: prompt,
      };

      try {
        const response = await axios.request(config);

        // Verificando e extraindo a resposta da IA
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0 || !candidates[0].content) {
          throw new Error("A resposta da API não contém o conteúdo esperado.");
        }

        const replyText = candidates[0].content.parts[0]?.text; // Extraindo o texto da resposta

        if (!replyText) {
          throw new Error('O campo "text" não foi encontrado na resposta.');
        }

        // Retorna o texto extraído
        return replyText;
      } catch (error) {
        console.error("Erro ao se comunicar com a API Gemini:", error);
        return "Houve um erro ao se comunicar com a IA Gemini. Tente novamente mais tarde.";
      }
    }

    // Comando Gemini
    if (command.startsWith("gpt")) {
      const message = text.slice(PREFIX.length + 4).trim();
      if (!message) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Por favor, forneça uma mensagem para o Gemini.*\n\n${getMessageEnd()}`,
        });
        return;
      }

      try {
        const responseText = await getGeminiResponse(message);

        await sock.sendMessage(msg.key.remoteJid, {
          text: responseText + `\n\n${getMessageEnd()}`,
        });
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "🤖", key: msg.key }, // Reação para Gemini
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Erro ao se comunicar com a API Gemini:* ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key }, // Reação de erro para Gemini
        });
      }
    }

    // Comando de info
    if (command === "info") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Informações sobre o bot 🤖:\n\n- *Bot: MagoBot*\n- *Versão: 1.4*\n- *Criador: Pedro Henrique 🧑‍💻*\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "ℹ️", key: msg.key },
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
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }, // Reação de erro para desligar
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "*Computador será desligado!* 💻🔌\n\n" + getMessageEnd(),
          });
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🔋", key: msg.key }, // Reação para desligar
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
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }, // Reação de erro para reiniciar
          });
        } else {
          sock.sendMessage(msg.key.remoteJid, {
            text: "*Computador será reiniciado!* 🔄\n\n" + getMessageEnd(),
          });
          sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🔄", key: msg.key }, // Reação para reiniciar
          });
        }
      });
      return;
    }

    if (command === "dado") {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🎲 Você rolou um *${diceRoll}*!\n\n${getMessageEnd()}`,
      });
    }

    if (command === "moeda") {
      // Gera um número aleatório entre 0 e 1
      const result = Math.random() < 0.5 ? "cara" : "coroa";

      await sock.sendMessage(msg.key.remoteJid, {
        text: `🪙 A moeda caiu em... *${result}*!\n\n${getMessageEnd()}`,
      });
    }

    if (command === "adivinha") {
      // Define o intervalo de números para adivinhar
      const min = 1;
      const max = 100;
      sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🤔", key: msg.key }, // Reação para reiniciar
      });

      // O bot escolhe um número aleatório dentro do intervalo
      const guessedNumber = Math.floor(Math.random() * (max - min + 1)) + min;

      await sock.sendMessage(msg.key.remoteJid, {
        text: `🤔 Estou pensando no número... Será que é *${guessedNumber}*?\n\n${getMessageEnd()}`,
      });
    }

    //const { buscarImagem } = require("./unsplash"); // Importa a função do arquivo unsplash.js

    // Adicione isso ao seu comando de !imagem
    if (command.startsWith("imagem")) {
      const keyword = text.slice(PREFIX.length + 7).trim(); // Remove PREFIX e 'imagem'

      if (!keyword) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Por favor, forneça uma palavra-chave para a busca de imagem.*\n\n${getMessageEnd()}`,
        });
        return;
      }

      try {
        const imageBuffer = await buscarImagem(keyword);

        // Salve o buffer da imagem em um arquivo temporário
        const tempFilePath = `./temp_image_${Date.now()}.jpg`;
        const fs = require("fs");
        fs.writeFileSync(tempFilePath, imageBuffer);

        // Envie a imagem como mídia
        await sock.sendMessage(msg.key.remoteJid, {
          image: { url: tempFilePath },
          caption: `Imagem relacionada a "${keyword}"\n\n${getMessageEnd()}`,
        });

        // Remove o arquivo temporário após o envio
        fs.unlinkSync(tempFilePath);

        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "🖼️", key: msg.key }, // Reação para imagem
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Erro ao buscar a imagem:* ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key }, // Reação de erro para imagem
        });
      }
      return;
    }

    // Função para fazer a requisição à API do SimSimi
    async function getSimSimiResponse(query) {
      let data = new FormData();
      data.append("lc", "pt");
      data.append("key", ""); // Substitua esse vazio pela sua chave da API SimSimi se necessário
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
          return "Desculpe, não consegui entender sua mensagem."; // Mensagem padrão para status não 200
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
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "🐥", key: msg.key }, // Reação para SimSimi
        });
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `*Erro ao se comunicar com a API SimSimi:* ${
            error.message
          }\n\n${getMessageEnd()}`,
        });
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key }, // Reação de erro para SimSimi
        });
      }
    }

    // Comando de abrir grupo
    if (command === "abrir") {
      if (!isOwner) {
        await sock.sendMessage(msg.key.remoteJid, {
          text:
            "*Você não tem permissão para usar este comando.*\n\n" +
            getMessageEnd(),
        });
        return;
      }

      const botAdmin = await isBotAdmin(msg.key.remoteJid);
      if (!botAdmin) {
        await sock.sendMessage(msg.key.remoteJid, {
          text:
            "*Não posso abrir o grupo porque não sou administrador.*\n\n" +
            getMessageEnd(),
        });
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key }, // Reação de erro
        });
        return;
      }

      // Abre o grupo
      await sock.groupSettingUpdate(msg.key.remoteJid, "not_announcement");
      await sock.sendMessage(msg.key.remoteJid, {
        text: "*O grupo foi aberto!* 🔓\n\n" + getMessageEnd(),
      });
      return;
    }

    if (command === "regras") {
      const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
      const groupDescription =
        groupMetadata.desc || "Nenhuma descrição disponível.";

      await sock.sendMessage(msg.key.remoteJid, {
        text: `📜 *Regras do Grupo:*\n\n${groupDescription}\n\n${getMessageEnd()}`,
      });
    }

    function getSaudacao(nome) {
      // Se o nome não funcionar ele vai falar humano
      nome = nome || "humano";
      const horaAtual = new Date().getHours();
      if (horaAtual >= 5 && horaAtual < 12) {
        return `Bom dia, ${nome}`;
      } else if (horaAtual >= 12 && horaAtual < 18) {
        return `Boa tarde, ${nome}`;
      } else if (horaAtual >= 18 && horaAtual < 24) {
        return `Boa noite, ${nome}`;
      } else {
        return `Boa madrugada, ${nome}`;
      }
    }

    // Comando de uptime
    if (command === "uptime") {
      const uptime = formatUptime(Date.now() - botStartTime);
      const saudacao = getSaudacao(msg.pushName);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🕐 ${saudacao}, o bot está online há *${uptime}*.\n\n${getMessageEnd()}`,
      });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🕐", key: msg.key },
      });

      // Comando de fechar grupo
      if (command === "fechar") {
        if (!isOwner) {
          await sock.sendMessage(msg.key.remoteJid, {
            text:
              "*Você não tem permissão para usar este comando.*\n\n" +
              getMessageEnd(),
          });
          return;
        }

        const botAdmin = await isBotAdmin(msg.key.remoteJid);
        if (!botAdmin) {
          await sock.sendMessage(msg.key.remoteJid, {
            text:
              "*Não posso fechar o grupo porque não sou administrador.*\n\n" +
              getMessageEnd(),
          });
          await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }, // Reação de erro
          });
          return;
        }

        // Fecha o grupo
        await sock.groupSettingUpdate(msg.key.remoteJid, "announcement");
        await sock.sendMessage(msg.key.remoteJid, {
          text: "*O grupo foi fechado!* 🔒\n\n" + getMessageEnd(),
        });
        return;
      }
    }
  });

  console.log("BOT LIGADO!");
}

function normalizeCommand(command) {
  return command.trim().toLowerCase();
}

// Função para formatar o uptime
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days} dias ${hours} horas ${minutes} minutos e ${seconds} segundos`;
}

async function getSimSimiResponse(message) {
  try {
    const response = await axios.post(SIMI_API_URL, {
      lc: "pt",
      text: message,
    });
    return response.data.contents;
  } catch (error) {
    throw new Error(
      `Não foi possível obter uma resposta do SimSimi: ${error.message}`
    );
  }
}

function getMessageEnd() {
  return "ミ★ *MagoBot JS 2.0* ★彡";
}

startBot();
