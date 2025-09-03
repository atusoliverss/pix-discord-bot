// src/services/pix/txid.js
// Gera um txid curto e razoavelmente único para uso local (máx 25 chars)

function generateTxid(prefix = '') {
  // limpa prefixo para apenas A-Z0-9
  const safePrefix = String(prefix || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

  // timestamp em ms -> base36 para encurtar
  const ts = Date.now().toString(36).toUpperCase()

  // random base36 (8 chars)
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase()

  // monta txid cru
  const raw = `${safePrefix}${ts}${rand}`

  // garantir máx 25 chars
  return raw.slice(0, 25)
}

module.exports = { generateTxid }
