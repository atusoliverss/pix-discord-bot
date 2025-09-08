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
      // /pix é slash command (abre modal). Message não consegue abrir modal.
      return message.reply(
        'O comando **Pix** agora é do tipo *slash*. Use **`/pix`** e escolha o tipo (Celular/CPF/CNPJ/E-mail/EVP ou BR Code).'
      )
    }

    // ---------------- fallback ----------------
    // se existir um slash command com o mesmo nome, sugira o uso
    const slashEquivalent = client.commands.get(commandName)
    if (slashEquivalent) {
      return message.reply(`⚠️ O comando "!${commandName}" não está disponível por texto. Use **/${commandName}**.`)
    }

    // comando desconhecido
    return message.reply(`❌ Comando não reconhecido: "!${commandName}"`)
  }
}
