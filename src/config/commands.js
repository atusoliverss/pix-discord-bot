// src/commands/pix/command.js
const { SlashCommandBuilder } = require('discord.js')
const { createPixModal } = require('./modal')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('Gerar QR Code Pix — abre formulário para valor e chave')
    .addStringOption(opt =>
      opt
        .setName('tipo')
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

  /**
   * Executa o comando. Funciona para:
   * - ChatInputCommandInteraction (slash /pix)
   * - ButtonInteraction (botão "Gerar outro QR")
   */
  async execute(interaction) {
    try {
      let tipo = 'CELULAR' // default quando vier de botão

      // Quando for slash command, pegamos o 'tipo' das opções
      if (typeof interaction.isChatInputCommand === 'function' && interaction.isChatInputCommand()) {
        const t = interaction.options.getString('tipo')
        if (t) tipo = String(t).toUpperCase()
      }

      // Cria e apresenta a modal de acordo com o tipo escolhido (ou default)
      const modal = createPixModal(tipo)
      await interaction.showModal(modal)
    } catch (err) {
      console.error('[pix:command] erro ao abrir modal:', err)
      // resposta segura (ephemeral) caso ocorra erro ao abrir a modal
      const payload = { content: 'Erro ao abrir o formulário. Tente novamente.', ephemeral: true }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {})
      } else {
        await interaction.reply(payload).catch(() => {})
      }
    }
  }
}
