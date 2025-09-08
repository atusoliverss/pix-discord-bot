// src/config/env.js
require('dotenv').config() // carrega variáveis do .env

// helper para pegar variáveis e já aplicar trim
function getEnv(key, fallback = undefined) {
  const val = process.env[key]
  return val ? val.trim() : fallback
}

const env = {
  DISCORD_TOKEN: getEnv('DISCORD_TOKEN'),
  CLIENT_ID: getEnv('CLIENT_ID'),

  // GUILD_IDS (lista separada por vírgula)
  GUILD_IDS: (process.env.GUILD_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),

  // mantém compatibilidade com GUILD_ID único (opcional)
  GUILD_ID: getEnv('GUILD_ID'),

  // Configurações do Pix
  PIX_MERCHANT_NAME: getEnv('PIX_MERCHANT_NAME', 'BOT PIX').slice(0, 25),
  PIX_MERCHANT_CITY: getEnv('PIX_MERCHANT_CITY', 'CIDADE').toUpperCase().slice(0, 15)
}

// ---- validações ----
if (!env.DISCORD_TOKEN) {
  console.error('❌ Faltou definir DISCORD_TOKEN no .env')
  process.exit(1)
}

if (!env.CLIENT_ID) {
  console.warn('⚠️ CLIENT_ID não definido. Deploy de comandos pode não funcionar.')
}

if (env.GUILD_IDS.length === 0 && !env.GUILD_ID) {
  console.warn('⚠️ Nenhuma guild definida. Deploy cairá como GLOBAL (propaga mais devagar).')
}

module.exports = env
