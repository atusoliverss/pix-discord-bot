// src/services/pix/payload.js
// Monta o BR Code (EMV) para Pix e calcula CRC16-IBM (0x1021).
// Referências úteis:
// - EMVCo MPM: POI “11” = estático, “12” = dinâmico.
// - BR Code / Pix (Banco Central): GUI "br.gov.bcb.pix", TXID em 62-05.
// - Limites práticos: Nome (59) até 25 chars, Cidade (60) até 15 chars.

/**
 * Retorna o tamanho em bytes (UTF-8) de uma string.
 * Usamos Buffer.byteLength para contar corretamente acentos/UTF-8.
 */
function byteLen(str) {
  return Buffer.byteLength(String(str ?? ''), 'utf8')
}

/**
 * Helper TLV: Tag + Length(2 dígitos decimais) + Value (EMV TLV decimal length).
 * Obs.: O padrão usa DOIS dígitos para o comprimento. Se ultrapassar 99 bytes,
 * isso continua válido porque subcampos e campos são aninhados (o conteúdo de 26, 62 etc.
 * soma vários TLVs menores). Mantemos 2 dígitos aqui como manda o EMV MPM.
 */
function emv(id, value) {
  const val = String(value ?? '')
  const len = String(byteLen(val)).padStart(2, '0')
  return `${id}${len}${val}`
}

/**
 * Cálculo do CRC16-IBM (polinômio 0x1021, seed 0xFFFF), maiúsculo, 4 hex chars.
 * O CRC é aplicado sobre TODO o payload incluindo o campo '6304' (sem o próprio CRC).
 */
function crc16(payload) {
  let crc = 0xFFFF
  const poly = 0x1021

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ poly) : (crc << 1)
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Sanitiza nome/cidade conforme limites do BR Code (e recomendações Pix).
 */
function sanitizeNameCity({ name, city }) {
  const n = String(name ?? 'RECEBEDOR').slice(0, 25) // 59
  // Cidade recomendada MAIÚSCULA para evitar incompatibilidades
  const c = String(city ?? 'CIDADE').toUpperCase().slice(0, 15) // 60
  return { name: n, city: c }
}

/**
 * Monta o payload BR Code Pix (EMV MPM).
 *
 * @param {Object} opts
 * @param {string} opts.chave         - chave Pix (email/cpf/cnpj/celular/EVP)
 * @param {number} opts.amount        - valor BRL (ex.: 10.50)
 * @param {string} opts.merchantName  - nome recebedor (≤25)
 * @param {string} opts.merchantCity  - cidade (≤15, MAIÚSC.)
 * @param {string} [opts.txid]        - identificador (≤25 típico no estático)
 * @param {string} [opts.description] - descrição opcional (≤25)
 * @param {boolean} [opts.static=true] - true = POI "11" (estático), false = "12" (dinâmico)
 *
 * @returns {string} payload EMV pronto para gerar o QR
 */
function buildPixPayload({
  chave,
  amount,
  merchantName,
  merchantCity,
  txid = '',
  description = '',
  static: isStatic = true
}) {
  if (!chave || typeof chave !== 'string') {
    throw new Error('Chave Pix inválida.')
  }
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    throw new Error('Valor inválido para o Pix.')
  }

  // POI: “11” (estático) ou “12” (dinâmico)
  const poi = isStatic ? '11' : '12'

  // Sanitizar nome/cidade conforme limites
  const { name, city } = sanitizeNameCity({ name: merchantName, city: merchantCity })

  // Se for QR estático, limite prático de 25 chars para o TXID
  let txidFinal = String(txid ?? '')
  if (isStatic) txidFinal = txidFinal.slice(0, 25)

  // Campo 00 - Payload Format Indicator
  const payloadFormat = emv('00', '01')

  // Campo 01 - Point of Initiation Method
  const pointOfInitiation = emv('01', poi)

  // Campo 26 - Merchant Account Information (BR Code Pix)
  // Subcampos:
  //   00 = GUI (obrigatório) -> "br.gov.bcb.pix"
  //   01 = Chave Pix
  //   02 = Descrição (opcional, cortada em 25)
  const gui   = emv('00', 'br.gov.bcb.pix')
  const keyF  = emv('01', chave)
  const descF = description ? emv('02', String(description).slice(0, 25)) : ''
  const mai   = emv('26', gui + keyF + descF)

  // Campo 52 - MCC (0000 se não aplicável)
  const mcc = emv('52', '0000')

  // Campo 53 - Moeda (986 = BRL)
  const currency = emv('53', '986')

  // Campo 54 - Valor (duas casas)
  const value = emv('54', Number(amount).toFixed(2))

  // Campo 58 - País
  const country = emv('58', 'BR')

  // Campo 59 - Nome do recebedor (≤25)
  const nameF = emv('59', name)

  // Campo 60 - Cidade (≤15, MAIÚSC.)
  const cityF = emv('60', city)

  // Campo 62 - Additional Data Field Template
  //   05 = txid (≤25 típico no estático; dinâmico pode variar por PSP)
  const adf  = emv('05', txidFinal)
  const addData = emv('62', adf)

  // Monta payload parcial + campo 63 como placeholder '6304' para calcular CRC
  const partial =
    payloadFormat +
    pointOfInitiation +
    mai +
    mcc +
    currency +
    value +
    country +
    nameF +
    cityF +
    addData +
    '6304'

  // Calcula CRC sobre o parcial
  const checksum = crc16(partial)

  // Retorna payload completo (EMV/BR Code Pix)
  return partial + checksum
}

module.exports = {
  buildPixPayload,
  // helpers expostos para testes
  emv,
  crc16,
  byteLen
}
