// src/events/messageCreate.js
// Permite comandos baseados em mensagens (prefix ex.: !)

const prefix = '!'

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    // ignora mensagens de bots
    if (message.author.bot) return

    // ignora se não começa com o prefixo definido
    if (!message.content.startsWith(prefix)) return

    // remove prefixo e separa em argumentos
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const commandName = (args.shift() || '').toLowerCase()
    if (!commandName) return // usuário só digitou "!"

    // ---------------- comandos manuais ----------------
    if (commandName === 'ping') {
      return message.reply('🏓 Pong!')
    }

    if (commandName === 'pix') {
      // simula chamar o slash /pix (abre modal)
      const cmd = client.commands.get('pix')
      if (cmd) {
        try {
          return await cmd.execute(message, client) // cuidado: execute espera Interaction, aqui é Message
        } catch (err) {
          console.error('[messageCreate] erro ao executar !pix:', err)
          return message.reply('⚠️ Erro ao processar o comando !pix.')
        }
      }
    }

    // ---------------- fallback ----------------
    // se quiser, delega outros comandos de texto para os slash registrados
    const slashEquivalent = client.commands.get(commandName)
    if (slashEquivalent) {
      return message.reply(`⚠️ O comando "!${commandName}" não está disponível, use "/${commandName}"`)
    }

    // comando desconhecido
    return message.reply(`❌ Comando não reconhecido: "!${commandName}"`)
  }
}
