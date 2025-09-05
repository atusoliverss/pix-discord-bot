// src/services/pix/brcode.js
// Utilitários para validação de BR Code (EMV Pix)

const { crc16 } = require('./payload')

/**
 * Sanitiza minimamente um BR Code:
 * - remove BOM e caracteres zero-width
 * - remove \r \n \t (quebras/tabs)
 * - preserva ESPAÇOS normais no meio do payload (são válidos e contam no TLV!)
 * - remove espaços só no início/fim com trim()
 */
function sanitizeBrcode(input) {
  return String(input || '')
    .replace(/\uFEFF/g, '')                  // BOM
    .replace(/[\u200B-\u200D\u2060]/g, '')   // zero-width
    .replace(/[\r\n\t]/g, '')                // quebras/tabs (preserva ' ')
    .trim()                                  // remove espaços só no início/fim
}

/**
 * Valida comprimentos EMV (TLV com 2 dígitos decimais para o length).
 * Retorna { ok, errorAt } onde errorAt é o índice em que detectou problema.
 */
function validateEmvLengths(code) {
  let i = 0
  const n = code.length
  const isDigit = ch => ch >= '0' && ch <= '9'
  const read2 = p => code.slice(p, p + 2)

  while (i + 4 <= n) {
    const tag = read2(i)
    const lenStr = read2(i + 2)
    if (!isDigit(lenStr[0]) || !isDigit(lenStr[1])) {
      return { ok: false, errorAt: i + 2 }
    }
    const len = parseInt(lenStr, 10)
    const startVal = i + 4
    const endVal = startVal + len
    if (endVal > n) return { ok: false, errorAt: startVal }

    i = endVal

    // Tag 63 = CRC; deve ter exatamente 4 chars e encerrar o payload
    if (tag === '63') {
      if (len !== 4) return { ok: false, errorAt: i - len }
      if (i !== n)   return { ok: false, errorAt: i } // sobrou lixo após CRC
      break
    }
  }
  return { ok: i === n, errorAt: i }
}

/**
 * Valida o CRC do payload:
 * - expected = calculado sobre tudo até '6304'
 * - got      = o valor que veio no payload
 */
function validateBrcodeCRC(brcode) {
  const code = sanitizeBrcode(brcode)
  const idx = code.lastIndexOf('6304')
  if (idx < 0 || code.length < idx + 8) {
    return { ok: false, expected: null, got: null, code, idx: -1, partial: null }
  }
  const partial = code.substring(0, idx + 4) // inclui '6304'
  const got = code.substring(idx + 4, idx + 8).toUpperCase()
  const expected = crc16(partial)
  return { ok: expected === got, expected, got, code, idx, partial }
}

module.exports = {
  sanitizeBrcode,
  validateEmvLengths,
  validateBrcodeCRC
}
