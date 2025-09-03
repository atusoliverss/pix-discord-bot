// src/config/env.js
require('dotenv').config() // carrega .env

// Fazemos a leitura e exportamos num objeto "env"
// Isso centraliza o acesso, evitando usar process.env espalhado pelo código
const env = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID, // útil para registrar comandos em uma guild específica

  // Configurações do Pix
  PIX_MERCHANT_NAME: process.env.PIX_MERCHANT_NAME || 'BOT PIX',
  PIX_MERCHANT_CITY: process.env.PIX_MERCHANT_CITY || 'IRECE',
}

module.exports = env
