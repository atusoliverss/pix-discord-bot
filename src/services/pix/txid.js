// src/services/pix/txid.js
// Gera um txid curto e razoavelmente único para uso local (máx 25 chars)

/**
 * Gera um txid baseado em timestamp + random string.
 * Retorna apenas caracteres seguros e corta para 25 chars.
 */
function generateTxid(prefix = '') {
  // timestamp em ms -> base36 para encurtar
  const ts = Date.now().toString(36).toUpperCase()
  // random base36
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase()
  const raw = `${prefix}${ts}${rand}`.replace(/[^A-Z0-9]/g, '')

  // garantir máx 25 chars (recomendação do payload)
  return raw.slice(0, 25)
}

module.exports = { generateTxid }
