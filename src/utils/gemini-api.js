const axios = require("axios");

async function getGeminiResponse(query) {
  const prompt = {
    contents: [
      {
        parts: [
          {
            text: `You are an AI named Unix, created by Pedro Henrique. Be friendly, keeping your responses simple and engaging. Use an asterisk to emphasize the text, as per WhatsApp's format. Interact naturally, asking interesting questions or commenting on something related to the topic. Reply in Portuguese most of the time, unless you notice that the user is using another language. Now, reply to the message below, ignoring the "!gpt" prefix:"${query}""`,
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

module.exports = { getGeminiResponse };
