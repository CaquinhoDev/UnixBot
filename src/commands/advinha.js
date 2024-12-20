const { arg } = require("mathjs");

// Variável para controlar o estado do jogo
let isGameActive = false;
let guessedNumber = null;
let currentGameUser = null;

module.exports = async function handleAdivinha(msg, sock, args) {
  const command = args.join(" ")[0]; // O comando digitado pelo usuário
  const userGuess = parseInt(args.join(" ")[1]); // O número que o usuário enviou

  // Verifica se o usuário quer iniciar ou sair do jogo
  if (command === "!adivinha") {
    // Se o jogo não está ativo, inicia um novo jogo
    if (!isGameActive) {
      // Inicia o jogo
      isGameActive = true;
      currentGameUser = msg.key.remoteJid; // Armazena o usuário que iniciou o jogo

      // Define o intervalo de números para adivinhar
      const min = 1;
      const max = 100;

      // O bot escolhe um número aleatório dentro do intervalo
      guessedNumber = Math.floor(Math.random() * (max - min + 1)) + min;

      const responseText = `🎲 Vamos começar! Estou pensando em um número entre *1* e *100*. Tente adivinhar!`;
      await sendMessageWithReaction(msg, sock, responseText, "🎲");
    } else {
      const responseText =
        "🚨 Você já está no meio de uma adivinhação! Tente adivinhar o número!";
      await sendMessageWithReaction(msg, sock, responseText, "🚨");
    }
  } else if (command === "!sair") {
    // Se o usuário quiser sair do jogo
    if (isGameActive && msg.key.remoteJid === currentGameUser) {
      isGameActive = false;
      guessedNumber = null;
      const responseText = "👋 Você saiu do jogo de adivinhação.";
      await sendMessageWithReaction(msg, sock, responseText, "👋");
    } else {
      const responseText = "⚠️ Não há jogo ativo ou você não está no jogo.";
      await sendMessageWithReaction(msg, sock, responseText, "⚠️");
    }
  } else if (isGameActive && userGuess !== undefined && !isNaN(userGuess)) {
    // Se o jogo está ativo e o usuário fez uma tentativa
    if (userGuess === guessedNumber) {
      const responseText = `🎉 Parabéns! Você acertou! O número era *${guessedNumber}*.\n\n`;
      await sendMessageWithReaction(msg, sock, responseText, "🎉");
      isGameActive = false;
      guessedNumber = null; // Limpa o número para reiniciar o jogo
    } else {
      let proximityMessage = "";
      const diff = Math.abs(userGuess - guessedNumber);

      if (diff <= 10) {
        proximityMessage =
          "Você está bem perto! Tente um número um pouco maior ou menor.";
      } else if (diff <= 20) {
        proximityMessage = "Você está moderadamente perto. Continue tentando!";
      } else {
        proximityMessage = "Está bem longe, tente um número bem diferente!";
      }

      const responseText = `❌ Errou! O número era *${guessedNumber}*.\n${proximityMessage}\n\n`;
      await sendMessageWithReaction(msg, sock, responseText, "❌");
    }
  } else if (isGameActive) {
    const responseText =
      "⚠️ Por favor, envie um número válido após o comando `!adivinha <número>`. Exemplo: `!adivinha 19`.";
    await sendMessageWithReaction(msg, sock, responseText, "⚠️");
  }
};

async function sendMessageWithReaction(msg, sock, text, emoji) {
  await sock.sendMessage(msg.key.remoteJid, { text: `${text}\n\n` });
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: emoji, key: msg.key },
  });
}
