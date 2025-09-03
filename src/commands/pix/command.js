// src/commands/pix/command.js
const { SlashCommandBuilder } = require('discord.js')
const { createPixModal } = require('./modal')

module.exports = {
  data: new SlashCommandBuilder()
  .setName('pix')
  .setDescription('Gerar QR Code Pix — abre formulário para valor e chave')
  .addStringOption(opt =>
    opt.setName('tipo')
      .setDescription('Tipo de chave Pix')
      .setRequired(true)
      .addChoices(
        { name: 'Celular', value: 'CELULAR' },
        { name: 'CPF',     value: 'CPF' },
        { name: 'CNPJ',    value: 'CNPJ' },
        { name: 'E-mail',  value: 'EMAIL' },
        { name: 'EVP',     value: 'EVP' }
      )
  ),

  async execute(interaction) {
    try {
      const tipo = interaction.options.getString('tipo') // CELULAR | CPF | CNPJ | EMAIL | EVP
      const modal = createPixModal(tipo)                 // passa o tipo
      await interaction.showModal(modal)
    } catch (err) {
      console.error('[pix:command] erro ao abrir modal:', err)
      await interaction.reply({ content: 'Erro ao abrir o formulário. Tente novamente.', ephemeral: true })
    }
  }
}
