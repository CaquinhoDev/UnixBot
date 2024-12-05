require("dotenv").config();

const PREFIX = "!";
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER;
const SIMI_API_URL = "https://api.simsimi.vn/v1/simtalk";
const GEMINI_API_KEY = process.env.GEMINI;

module.exports = { PREFIX, OWNER_PHONE_NUMBER, SIMI_API_URL, GEMINI_API_KEY };
