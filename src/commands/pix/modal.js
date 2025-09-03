// src/commands/pix/modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

function createPixModal(tipo = 'CELULAR') {
  const safeTipo = String(tipo || 'CELULAR').toUpperCase()

  const modal = new ModalBuilder()
    .setCustomId(`pixModal:${safeTipo}`) // <- codifica o tipo
    .setTitle('Gerar QR Code Pix')

  // Campo de valor (obrigatório)
  const valorInput = new TextInputBuilder()
    .setCustomId('valor')
    .setLabel('Valor em BRL (ex.: 10.50)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('10.00')
    .setMaxLength(10)

  // Placeholders por tipo de chave
  const placeholderPorTipo = {
    CELULAR: '+55DD9XXXXXXXXX',  // 13 dígitos após 55
    CPF:     '00000000000',
    CNPJ:    '00000000000000',
    EMAIL:   'exemplo@dominio.com',
    EVP:     'chave aleatória (UUID)'
  }

  // Valor inicial (pré-preenchido para celular)
  let initialValue = ''
  if (safeTipo === 'CELULAR') {
    initialValue = '+55' // já aparece no campo
  }

  // Campo da chave Pix
  const chaveInput = new TextInputBuilder()
    .setCustomId('chavepix')
    .setLabel(`Chave Pix (${safeTipo})`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(placeholderPorTipo[safeTipo] || 'sua chave Pix')
    .setValue(initialValue) // <-- pré-preenche só para celular
    .setMaxLength(77)

  // Adiciona os campos à modal
  modal.addComponents(
    new ActionRowBuilder().addComponents(valorInput),
    new ActionRowBuilder().addComponents(chaveInput)
  )

  return modal
}

module.exports = { createPixModal }
