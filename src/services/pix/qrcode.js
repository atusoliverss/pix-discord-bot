// src/services/pix/qrcode.js
// Gera um PNG (Buffer) a partir do payload BR Code usando a lib "qrcode"

const QRCode = require('qrcode')

/**
 * payloadToPngBuffer(payload)
 * Recebe a string BR Code (payload) e retorna um Buffer com o PNG do QR.
 */
async function payloadToPngBuffer(payload) {
  // usamos toDataURL e convertemos para Buffer (compatível com Discord AttachmentBuilder)
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 1, // margem pequena
    scale: 6   // aumenta resolução (opcional)
  })

  // dataUrl tem formato "data:image/png;base64,...."
  const base64 = dataUrl.split(',')[1]
  return Buffer.from(base64, 'base64')
}

module.exports = {
  payloadToPngBuffer
}
