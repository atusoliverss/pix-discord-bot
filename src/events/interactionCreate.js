// src/events/interactionCreate.js
// Responsável por lidar com slash commands e outros tipos de interação

module.exports = {
  name: 'interactionCreate',
  once: false, // escuta sempre que ocorre
  async execute(interaction, client) {
    if (!interaction.isCommand()) return

    const command = client.commands.get(interaction.commandName)
    if (!command) {
      await interaction.reply({ content: '❌ Comando não encontrado!', ephemeral: true })
      return
    }

    try {
      // executa o comando (ex.: handler de /pix)
      await command.execute(interaction, client)
    } catch (error) {
      console.error('Erro ao executar comando:', error)
      await interaction.reply({ content: '⚠️ Ocorreu um erro ao executar este comando.', ephemeral: true })
    }
  }
}
