const axios = require("axios");

async function getGeminiResponse(query) {
  const prompt = {
    contents: [
      {
        parts: [
          {
            text: `You are an AI model named Aurora. Mention that this bot was created by Pedro Henrique, 
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

module.exports = { getGeminiResponse };
