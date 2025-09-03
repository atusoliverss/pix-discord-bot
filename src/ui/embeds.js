// src/ui/embeds.js
// Centraliza a construção de embeds e botões do bot Pix.

const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

const COLOR_PRIMARY = 0x1f6feb
const COLOR_SUCCESS = 0x2ea043
const COLOR_ERROR   = 0xd73a49
const COLOR_INFO    = 0x646cff

/**
 * Formata valor em BRL com fallback seguro.
 * Ex.: 10.5 -> "R$ 10,50"
 */
function formatBRL(amount) {
  const n = Number(amount)
  if (!isFinite(n) || isNaN(n) || n < 0) return 'R$ —'
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

/**
 * Corta texto para evitar estouro de limites do Discord (exibe "…").
 */
function truncate(text, max = 120) {
  const s = String(text ?? '')
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/**
 * Embed principal do Pix (com dados do pagamento e imagem do QR).
 */
function createPixEmbed({ amount, chave, keyType, txid }) {
  const chaveShown = truncate(chave, 200) // exibição agradável
  const txidShown  = truncate(txid || '—', 30) // 25 é o prático; deixei 30 por segurança visual

  return new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle('QR Code Pix gerado')
    .setDescription('Escaneie o QR abaixo ou use o arquivo **brcode.txt** para copiar/colar no app do banco.')
    .addFields(
      { name: 'Valor', value: formatBRL(amount), inline: true },
      { name: 'Tipo de chave', value: keyType || '—', inline: true },
      { name: 'Chave Pix', value: `\`${chaveShown}\`` },
      { name: 'TXID', value: txidShown }
    )
    .setImage('attachment://pix.png')
    .setFooter({ text: 'Pagamento Pix (QR estático)' })
    .setTimestamp(Date.now())
}

/**
 * Linha de botões que acompanha o embed do Pix.
 * - Copiar BR Code (retorna ephemeral com o código)
 * - Gerar outro QR (reabre o comando /pix)
 */
function createPixButtons() {
  const copyBtn = new ButtonBuilder()
    .setCustomId('copy_brcode')
    .setLabel('📋 Copiar BR Code')
    .setStyle(ButtonStyle.Secondary)

  const newBtn = new ButtonBuilder()
    .setCustomId('new_qr')
    .setLabel('➕ Gerar outro QR')
    .setStyle(ButtonStyle.Primary)

  return new ActionRowBuilder().addComponents(copyBtn, newBtn)
}

/**
 * Embeds auxiliares (opcionais).
 */
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
  createErrorEmbed,
  // utils úteis noutros pontos do app
  formatBRL,
  truncate
}
