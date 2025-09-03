// src/services/pix/qrcode.js
// Gera um PNG (Buffer) a partir do payload BR Code usando a lib "qrcode"

const QRCode = require('qrcode')

/**
 * Gera um Buffer PNG a partir do payload Pix (BR Code).
 *
 * @param {string} payload - o payload EMV Pix já montado
 * @param {object} [options] - opções visuais do QR
 * @param {number} [options.scale=6] - fator de escala (resolução)
 * @param {number} [options.margin=1] - margem ao redor do QR
 * @returns {Promise<Buffer>}
 */
async function payloadToPngBuffer(payload, options = {}) {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Payload inválido para gerar QR Code.')
  }

  const { scale = 6, margin = 1 } = options

  // Usa diretamente toBuffer para obter um Buffer PNG
  return await QRCode.toBuffer(payload, {
    errorCorrectionLevel: 'M',
    type: 'png',
    margin,
    scale
  })
}

module.exports = {
  payloadToPngBuffer
}
