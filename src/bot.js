const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode");
const { PREFIX, OWNER_PHONE_NUMBER } = require("./config");
const comandoInfo = require("./commands/info");
const { downloadYouTubeVideo } = require("./commands/play");
const { createStickerCommand } = require("./commands/sticker");
const { checkUrlCommand } = require("./commands/checkurl");

let botStartTime = Date.now();
let stickerMode = false;

async function startBot() {
  console.log("Iniciando o bot...");

  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  console.log("Estado de autenticação carregado");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["CaquinhoDev", "", ""],
    version: [2, 3000, 1023223821],
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (update) =>
    handleConnectionUpdate(update, sock)
  );
  sock.ev.on("messages.upsert", async (m) => await handleMessage(m, sock));

  sock.ev.on("call", async (callUpdate) => {
    for (const call of callUpdate) {
      if (call.status === "ringing") {
        console.log(`Recebendo chamada de ${call.from}`);
        await sock.rejectCall(call.id, call.from);
        console.log(`Chamada de ${call.from} foi recusada.`);
        await sock.sendMessage(call.from, {
          text: "Desculpe, eu não aceito chamadas. Por favor, envie uma mensagem.",
        });
      }
    }
  });
}

function handleConnectionUpdate(update, sock) {
  const { connection, qr, lastDisconnect } = update;

  if (connection === "open") {
    console.log("Conexão aberta com sucesso!");
  }

  if (qr) {
    console.log("QR Code Recebido!");
    generateQRCode(qr);
  }

  if (connection === "close") {
    const shouldReconnect =
      lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
    if (shouldReconnect) {
      console.log("Reconectando...");
      startBot();
    } else {
      console.log("Bot foi desconectado permanentemente.");
    }
  }
}

function generateQRCode(qr) {
  const qrImagePath = path.join(__dirname, "QRCODE", "qr-code.png");
  const qrDir = path.dirname(qrImagePath);
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  qrcode.toFile(qrImagePath, qr, { type: "png" }, (err) => {
    if (err) console.error("Erro ao gerar o QR code: ", err);
  });
}

async function handleMessage({ messages }, sock) {
  const msg = messages[0];

  if (!msg.message || msg.key.fromMe) return;

  const from = msg.key.remoteJid;

  const text =
    msg.message.conversation || msg.message.extendedTextMessage?.text;

  if (text && text.startsWith(PREFIX)) {
    const commandText = text.slice(PREFIX.length).trim().toLowerCase();
    const [command, ...args] = commandText.split(" ");

    if (command === "checkurl") {
      await checkUrlCommand(msg, sock, args);
      return;
    }

    if (command === "play") {
      await reactWhileProcessing(msg, sock, async () => {
        // Primeiro, faz o download do vídeo do YouTube e envia o áudio
        await downloadYouTubeVideo(msg, sock, args);

        // Depois, simula a resposta com o contato META AI
        const vcard =
          "BEGIN:VCARD\n" +
          "VERSION:3.0\n" +
          "FN:Meta AI\n" +
          "ORG:By Caquinho Dev;\n" +
          "TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\n" +
          "END:VCARD";

        await sock.sendMessage(msg.key.remoteJid, {
          text: "🎶 Aqui está o áudio que você pediu!",
          contextInfo: {
            quotedMessage: {
              contactMessage: {
                displayName: "By Pedro 😎",
                vcard: vcard,
              },
            },
            participant: "0@s.whatsapp.net",
          },
        });

        console.log("Áudio enviado junto com resposta simulada!");
      });

      return;
    }

    const commandHandlers = getCommandHandlers();
    if (commandHandlers[command]) {
      await commandHandlers[command](msg, sock, args);
    } else {
      await sendMessageWithReaction(
        msg,
        sock,
        "*Comando não encontrado. Tente novamente.*",
        "❌"
      );
    }
  }

  if (msg.message.audioMessage) {
    try {
      await require("./commands/shazam")(msg, sock);
    } catch (error) {
      console.error("Erro ao processar áudio:", error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Erro ao processar o áudio. Tente novamente.",
      });
    }
  }

  if (msg.message.imageMessage) {
    try {
      await createStickerCommand(msg, sock);
    } catch {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Erro ao criar figurinha. Tente novamente.",
      });
    }
  }
}

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: emoji, key: msg.key },
  });
}

async function reactWhileProcessing(msg, sock, callback) {
  await sock.sendMessage(
    msg.key.remoteJid,
    { text: "_🎶 Baixando música, aguarde..._" },
    { quoted: msg }
  );
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "⏳", key: msg.key },
  });
  await callback();
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "✅", key: msg.key },
  });
}

function getCommandHandlers() {
  return {
    ping: require("./commands/ping"),
    calcular: require("./commands/calcular"),
    criador: require("./commands/criador"),
    menu: require("./commands/menu"),
    dono: require("./commands/dono"),
    ban: require("./commands/ban"),
    gpt: require("./commands/gemini"),
    simi: require("./commands/simi"),
    imagem: require("./commands/imagem"),
    adivinha: require("./commands/advinha"),
    moeda: require("./commands/moeda"),
    encurtaurl: require("./commands/encurtaurl"),
    traduzir: require("./commands/traduzir"),
    piada: require("./commands/piada"),
    ddd: require("./commands/ddd"),
    pesquisar: require("./commands/pesquisar"),
    dado: require("./commands/dado"),
    regras: require("./commands/regras"),
    gtts: require("./commands/gtts"),
    convite: require("./commands/convite"),
    noticias: require("./commands/noticias"),
    pix: require("./commands/pix"),
    revelar: require("./commands/revelar"),
    uptime: require("./commands/uptime"),
    sorteio: require("./commands/sorteio"),
    todos: require("./commands/todos"),
    fechar: require("./commands/fechar"),
    abrir: require("./commands/abrir"),
    shazam: require("./commands/shazam"),
    info: comandoInfo,
  };
}

startBot();
