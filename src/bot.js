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
//const { comandoAdivinha, tentarAdivinhar } = require("./commands/advinha");

// Estado do bot
let botStartTime = Date.now();
let aguardandoAudio = new Set();

// Função para inicializar o bot
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
  sock.ev.on(
    "messages.upsert",
    async (message) => await handleMessage(message, sock)
  );
}

// Função para tratar eventos de conexão
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

// Função para gerar o QR Code
function generateQRCode(qr) {
  const qrImagePath = path.join(__dirname, "src", "QRCODE", "qr-code.png");
  const qrDir = path.dirname(qrImagePath);
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }

  qrcode.toFile(qrImagePath, qr, { type: "png" }, (err) => {
    if (err) {
      console.error("Erro ao gerar o QR code: ", err);
    } else {
      console.log(`QR Code salvo em ${qrImagePath}.`); // Correção aqui: use crases para interpolação
    }
  });
}

// Função para processar mensagens recebidas
async function handleMessage({ messages }, sock) {
  const msg = messages[0];
  console.log("Mensagem processada:", msg);

  if (!msg.message || msg.key.fromMe) return;

  // Verificar se a mensagem é de áudio
  if (msg.message.audioMessage) {
    console.log("Mensagem de áudio detectada!");
    return await handleVoiceMessage(msg, sock); // Chama diretamente a função de áudio
  }

  const text =
    msg.message.conversation || msg.message.extendedTextMessage?.text;

  // Verifica se é uma mensagem de comando (inicia com o PREFIX)
  if (text && text.startsWith(PREFIX)) {
    const commandText = text.slice(PREFIX.length).trim();
    const [command, ...args] = commandText.split(" ");
    const isOwner = msg.key.remoteJid === OWNER_PHONE_NUMBER;

    console.log("Comando identificado:", command);
  }
}

// Função para obter os manipuladores de comando. AVISO: é aqui que o comando funcionará, se mudar aqui o comando também vai mudar.
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
    dado: require("./commands/dado"),
    uptime: require("./commands/uptime"),
    fechar: require("./commands/fechar"),
    abrir: require("./commands/abrir"),
    info: comandoInfo,
  };
}

// Função para enviar mensagens com reações
async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` }); // Correção aqui: use crases para interpolação
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: emoji, key: msg.key },
  });
}

// Função para normalizar o comando (em minúsculas)
function normalizeCommand(command) {
  return command.trim().toLowerCase();
}

// Iniciar o bot
startBot();
