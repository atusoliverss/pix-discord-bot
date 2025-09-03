// src/events/messageCreate.js
// Permite comandos baseados em mensagens (prefix ex.: !)

const prefix = '!'

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return
    if (!message.content.startsWith(prefix)) return

    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    // exemplo simples: !ping
    if (commandName === 'ping') {
      return message.reply('🏓 Pong!')
    }

    // ou delegar para os mesmos comandos slash se quiser
  }
}
