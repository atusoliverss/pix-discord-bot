// src/ui/embeds.js
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

const COLOR_PRIMARY = 0x1f6feb
const COLOR_SUCCESS = 0x2ea043
const COLOR_ERROR   = 0xd73a49
const COLOR_INFO    = 0x646cff

function formatBRL(amount) {
  const n = Number(amount)
  if (!isFinite(n) || isNaN(n)) return 'R$ —'
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

function escapeBackticks(str = '') {
  return String(str).replace(/`/g, 'ˋ') // acento grave “seguro” visualmente similar
}

/**
 * Embed principal do Pix (com dados do pagamento e imagem do QR).
 * @param {Object} opts
 * @param {number} opts.amount
 * @param {string} opts.chave
 * @param {string} opts.keyType
 * @param {string} opts.txid
 * @param {string} [opts.qrFilename='pix.png'] - nome do attachment de imagem usado em setImage()
 */
function createPixEmbed({ amount, chave, keyType, txid, qrFilename = 'pix.png' }) {
  return new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle('QR Code Pix gerado')
    .setDescription('Escaneie o QR abaixo. Se preferir, use o botão **Copiar BR Code**.')
    .addFields(
      { name: 'Valor', value: formatBRL(amount), inline: true },
      { name: 'Tipo de chave', value: keyType || '—', inline: true },
      { name: 'Chave Pix', value: `\`${escapeBackticks(chave)}\`` },
      { name: 'TXID', value: txid || '—' }
    )
    .setImage(`attachment://${qrFilename}`)
    .setFooter({ text: 'Pagamento Pix (QR estático)' })
    .setTimestamp(Date.now())
}

/** Linha com 3 botões */
function createPixButtons() {
  const copyBtn = new ButtonBuilder()
    .setCustomId('copy_brcode')
    .setLabel('📋 Copiar BR Code')
    .setStyle(ButtonStyle.Secondary)

  const newBtn = new ButtonBuilder()
    .setCustomId('new_qr')
    .setLabel('➕ Gerar outro QR')
    .setStyle(ButtonStyle.Primary)

  const fromBrcodeBtn = new ButtonBuilder()
    .setCustomId('brcode_to_qr')
    .setLabel('🔄 QR de BR Code')
    .setStyle(ButtonStyle.Secondary)

  return new ActionRowBuilder().addComponents(copyBtn, newBtn, fromBrcodeBtn)
}

function createSuccessEmbed(title, description = '') {
  return new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setTitle(title || 'Tudo certo!')
    .setDescription(description)
    .setTimestamp(Date.now())
}

function createInfoEmbed(title, description = '') {
  return new EmbedBuilder()
    .setColor(COLOR_INFO)
    .setTitle(title || 'Informação')
    .setDescription(description)
    .setTimestamp(Date.now())
}

function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(COLOR_ERROR)
    .setTitle('Ocorreu um erro')
    .setDescription(message || 'Tente novamente.')
    .setTimestamp(Date.now())
}

module.exports = {
  createPixEmbed,
  createPixButtons,
  createSuccessEmbed,
  createInfoEmbed,
  createErrorEmbed
}
