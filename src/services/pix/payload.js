// src/services/pix/payload.js
// Monta o BR Code (EMV) para Pix e calcula CRC16-IBM (padrão usa polinômio 0x1021)

/**
 * Helper: monta um TLV (Tag + Length (2 dígitos) + Value).
 * Atenção: esta implementação usa 2 dígitos para o length (padrão EMV).
 */
function emv(id, value) {
  const len = String(Buffer.from(value, 'utf8').length).padStart(2, '0')
  return `${id}${len}${value}`
}

/**
 * Calcula CRC16-IBM (polinômio 0x1021) para o payload.
 * Retorna 4 hex chars maiúsculos.
 */
function crc16(payload) {
  // algoritmo padrão do Pix/EMV para CRC16
  let crc = 0xFFFF
  const poly = 0x1021

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ poly) & 0xFFFF
      } else {
        crc = (crc << 1) & 0xFFFF
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * buildPixPayload(options)
 * options = {
 *   chave: string,           // chave Pix recebedora (email, cpf, celular, EVP)
 *   amount: number,          // valor em BRL (ex: 10.50)
 *   merchantName: string,    // nome do recebedor (máx 25 chars)
 *   merchantCity: string,    // cidade (máx 15 chars)
 *   txid: string,            // identificador (máx 25 chars)
 *   description: string      // descrição opcional
 * }
 *
 * Retorna a string BR Code pronta para ser convertida em QR.
 */
function buildPixPayload({ chave, amount, merchantName, merchantCity, txid, description }) {
  // 00 - Payload Format Indicator
  const payloadFormat = emv('00', '01')

  // 01 - Point of Initiation Method: '11' para QR estático com valor fixo.
  // (obs: alguns usos usam '12' para dinâmico; aqui usamos '11' conforme exemplo)
  const pointOfInitiation = emv('01', '11')

  // 26 - Merchant Account Information (subfields)
  const gui = emv('00', 'br.gov.bcb.pix')   // GUI obrigatória para Pix
  const keyField = emv('01', chave)         // subfield 01 = chave Pix
  const descField = description ? emv('02', description.substring(0, 25)) : '' // opcional
  const merchantAccountInfo = emv('26', gui + keyField + descField)

  // 52 - Merchant Category Code (0000 se não informado)
  const mcc = emv('52', '0000')

  // 53 - Currency (986 = BRL)
  const currency = emv('53', '986')

  // 54 - Transaction amount (string com duas casas)
  const valueStr = Number(amount).toFixed(2)
  const value = emv('54', valueStr)

  // 58 - Country code
  const country = emv('58', 'BR')

  // 59 - Merchant name (máx 25 chars)
  const name = emv('59', (merchantName || 'NOME').substring(0, 25))

  // 60 - Merchant city (máx 15 chars, uppercase recomendado)
  const city = emv('60', (merchantCity || 'SAO PAULO').substring(0, 15).toUpperCase())

  // 62 - Additional Data Field Template (subfield 05 = txid)
  const adf = emv('05', txid || '') // txid pode ser vazio para cobrar sem txid
  const additionalData = emv('62', adf)

  // concatena tudo e adiciona o campo 63 (CRC) como placeholder '6304'
  const partial = payloadFormat +
                  pointOfInitiation +
                  merchantAccountInfo +
                  mcc +
                  currency +
                  value +
                  country +
                  name +
                  city +
                  additionalData +
                  '6304'

  // calcula CRC sobre a string parcial e a adiciona
  const checksum = crc16(partial)
  return partial + checksum
}

module.exports = {
  buildPixPayload,
  // exportamos também helpers (úteis para testes)
  emv,
  crc16
}
