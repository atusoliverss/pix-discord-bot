// src/commands/pix/command.js
const { SlashCommandBuilder } = require('discord.js')
const { createPixModal, createBrcodeModal } = require('./modal')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('Gerar QR Code Pix — por chave (celular/cpf/...) ou colando um BR Code')
    .addStringOption(opt =>
      opt
        .setName('tipo')
        .setDescription('Tipo de chave Pix (ou BR Code)')
        .setRequired(true)
        .addChoices(
          { name: 'Celular',  value: 'CELULAR' },
          { name: 'CPF',      value: 'CPF' },
          { name: 'CNPJ',     value: 'CNPJ' },
          { name: 'E-mail',   value: 'EMAIL' },
          { name: 'EVP',      value: 'EVP' },
          { name: 'BR Code',  value: 'BR_CODE' } // <- NOVO
        )
    ),

  /**
   * Executa o comando. Funciona para:
   * - ChatInputCommandInteraction (slash /pix)
   * - ButtonInteraction (quando chamado por atalho; usa default CELULAR)
   */
  async execute(interaction) {
    try {
      let tipo = 'CELULAR' // default quando vier de botão

      // Quando for slash command, pegamos o 'tipo' das opções
      if (typeof interaction.isChatInputCommand === 'function' && interaction.isChatInputCommand()) {
        const t = interaction.options.getString('tipo')
        if (t) tipo = String(t).toUpperCase()
      }

      // Se for BR Code, abre a modal de colar o copia-e-cola
      if (tipo === 'BR_CODE') {
        const modal = createBrcodeModal()
        await interaction.showModal(modal)
        return
      }

      // Caso contrário, abre a modal de chave Pix conforme o tipo
      const modal = createPixModal(tipo)
      await interaction.showModal(modal)
    } catch (err) {
      console.error('[pix:command] erro ao abrir modal:', err)
      const payload = { content: 'Erro ao abrir o formulário. Tente novamente.', ephemeral: true }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {})
      } else {
        await interaction.reply(payload).catch(() => {})
      }
    }
  }
}
