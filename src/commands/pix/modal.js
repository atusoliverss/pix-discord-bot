// src/commands/pix/modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

/**
 * Cria e retorna uma ModalBuilder pronta para uso.
 * Usamos uma função pra garantir que uma nova instância é criada a cada vez (evita reuso de estado).
 */
function createPixModal() {
  // monta a modal com um customId que será usado no submit handler
  const modal = new ModalBuilder()
    .setCustomId('pixModal') // IDENTIFICADOR fundamental para capturar o submit depois
    .setTitle('Gerar Pix')

  // input do valor (campo curto)
  const valorInput = new TextInputBuilder()
    .setCustomId('valor') // id do campo para recuperar o valor depois
    .setLabel('Valor em BRL (ex: 10.50)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('10.00')

  // input da chave Pix (email, cpf, celular, chave aleatória)
  const chaveInput = new TextInputBuilder()
    .setCustomId('chavepix')
    .setLabel('Chave Pix (ex: exemplo@teste.com, 5511999998888, 00000000000)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('ex: exemplo@teste.com ou 5511999998888')

  // cada TextInput precisa estar dentro de um ActionRow
  modal.addComponents(
    new ActionRowBuilder().addComponents(valorInput),
    new ActionRowBuilder().addComponents(chaveInput)
  )

  return modal
}

module.exports = { createPixModal }
