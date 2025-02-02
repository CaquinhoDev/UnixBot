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
const comandoVoz = require("./commands/voz");
const { downloadYouTubeVideo } = require("./commands/play");
const { createStickerCommand } = require("./commands/sticker");
const { checkUrlCommand } = require("./commands/checkurl");

let botStartTime = Date.now();
let aguardandoAudio = new Set();
let stickerModes = {}; // Objeto para rastrear o modo de sticker por chat

async function startBot() {
  console.log("Iniciando o bot...");

  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  console.log("Estado de autenticação carregado");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
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
  console.log("Conexão atualizada:", update);

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
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }

  qrcode.toFile(qrImagePath, qr, { type: "png" }, (err) => {
    if (err) {
      console.error("Erro ao gerar o QR code: ", err);
    } else {
      console.log(`QR Code salvo em ${qrImagePath}.`);
    }
  });
}

async function handleMessage({ messages }, sock) {
  const msg = messages[0];
  console.log("Mensagem processada:", msg);

  if (!msg.message || msg.key.fromMe) return;

  const text =
    msg.message.conversation || msg.message.extendedTextMessage?.text;

  if (text && text.startsWith(PREFIX)) {
    const commandText = text.slice(PREFIX.length).trim().toLowerCase();
    const [command, ...args] = commandText.split(" ");
    const isOwner = msg.key.remoteJid === OWNER_PHONE_NUMBER;

    console.log("Comando identificado:", command);

    // Função para enviar mensagem com reação
    async function sendMessageWithReaction(msg, sock, text, emoji) {
      await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` });
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: emoji, key: msg.key },
      });
    }

    if (command === "sticker") {
      stickerModes[msg.key.remoteJid] = true; // Ativa o modo para o chat específico
      await sendMessageWithReaction(
        msg,
        sock,
        "*Modo de figurinha ativado. Envie uma mídia para criar uma figurinha.*",
        "✅"
      );
      return;
    }

    if (command === "checkurl") {
      await checkUrlCommand(msg, sock, args);
      return;
    }

    if (command === "play") {
      await downloadYouTubeVideo(msg, sock, args);
      return;
    }

    if (command === "áudio" || command === "audio") {
      aguardandoAudio.add(msg.key.remoteJid);
      await sendMessageWithReaction(
        msg,
        sock,
        "Estou aguardando seu áudio...",
        "✅"
      );
      return;
    }

    const commandHandlers = getCommandHandlers();
    if (commandHandlers[command]) {
      await commandHandlers[command](msg, sock, args, isOwner);
    } else {
      await sendMessageWithReaction(
        msg,
        sock,
        "*Comando não encontrado. Tente novamente.*",
        "❌"
      );
    }
  }
}

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: emoji, key: msg.key },
  });
}

function getCommandHandlers() {
  return {
    ping: require("./commands/ping"),
    calcular: require("./commands/calcular"),
    criador: require("./commands/criador"),
    menu: require("./commands/menu"),
    dono: require("./commands/dono"),
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
    uptime: require("./commands/uptime"),
    sorteio: require("./commands/sorteio"),
    todos: require("./commands/todos"),
    fechar: require("./commands/fechar"),
    abrir: require("./commands/abrir"),
    info: comandoInfo,
  };
}

// Função para lidar com mensagens de voz
async function handleVoiceMessage(msg, sock) {
  console.log("Entrou na função handleVoiceMessage!");

  if (aguardandoAudio.has(msg.key.remoteJid)) {
    console.log("Áudio recebido! Processando...");
    const audioUrl = msg.message.audioMessage.url;
    console.log("URL do áudio:", audioUrl);

    await comandoVoz(msg, sock, audioUrl); // Aqui chama o comando do arquivo voz.js
    aguardandoAudio.delete(msg.key.remoteJid);
  } else {
    console.log("Áudio recebido, mas não estava aguardando áudio.");
    await sendMessageWithReaction(
      msg,
      sock,
      "Envie o comando !áudio primeiro para começar a captura.",
      "❌"
    );
  }
}

startBot();
