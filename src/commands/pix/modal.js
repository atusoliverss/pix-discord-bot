// src/commands/pix/modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

function createPixModal(tipo = 'CELULAR') {
  const safeTipo = String(tipo || 'CELULAR').toUpperCase()

  const modal = new ModalBuilder()
    .setCustomId(`pixModal:${safeTipo}`)
    .setTitle('Gerar QR Code Pix')

  const valorInput = new TextInputBuilder()
    .setCustomId('valor')
    .setLabel('Valor em BRL (ex.: 10.50)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('10.00')
    .setMaxLength(10)

  const placeholderPorTipo = {
    CELULAR: '+55DD9XXXXXXXXX',
    CPF:     '00000000000',
    CNPJ:    '00000000000000',
    EMAIL:   'exemplo@dominio.com',
    EVP:     'chave aleatória (UUID)'
  }

  let initialValue = ''
  if (safeTipo === 'CELULAR') initialValue = '+55'

  const chaveInput = new TextInputBuilder()
    .setCustomId('chavepix')
    .setLabel(`Chave Pix (${safeTipo})`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(placeholderPorTipo[safeTipo] || 'sua chave Pix')
    .setValue(initialValue)
    .setMaxLength(77)

  modal.addComponents(
    new ActionRowBuilder().addComponents(valorInput),
    new ActionRowBuilder().addComponents(chaveInput)
  )

  return modal
}

/** Modal para colar um BR Code e gerar o QR correspondente */
function createBrcodeModal() {
  const modal = new ModalBuilder()
    .setCustomId('brcodeModal')
    .setTitle('Gerar QR a partir do BR Code')

  const brInput = new TextInputBuilder()
    .setCustomId('brcode_text')
    .setLabel('Cole aqui o BR Code (copia e cola)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('00020126...6304ABCD')

  modal.addComponents(new ActionRowBuilder().addComponents(brInput))
  return modal
}

module.exports = { createPixModal, createBrcodeModal }
