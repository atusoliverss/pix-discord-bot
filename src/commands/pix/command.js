// src/commands/pix/command.js
const { SlashCommandBuilder } = require('discord.js')
const { createPixModal } = require('./modal')

// Exportamos um objeto com 'data' (para registrar o comando) e 'execute' (o que acontece quando o comando é usado)
module.exports = {
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('Gerar QR Code Pix — abre formulário para valor e chave'),

  // quando o comando é executado no Discord, o interaction é um ChatInputCommandInteraction
  async execute(interaction) {
    try {
      // cria a modal (sempre criar nova instância)
      const modal = createPixModal()
      // abre a modal para o usuário
      await interaction.showModal(modal)
    } catch (err) {
      console.error('[pix:command] erro ao abrir modal:', err)
      // resposta curta e ephemeral para o usuário
      await interaction.reply({ content: 'Erro ao abrir o formulário. Tente novamente.', ephemeral: true })
    }
  }
}
