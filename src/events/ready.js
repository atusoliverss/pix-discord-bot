// src/events/ready.js
// Evento disparado quando o bot fica online (conectado ao Discord)

const { ActivityType } = require('discord.js')

module.exports = {
  name: 'ready',      // nome do evento
  once: true,         // true = escuta apenas 1 vez
  execute(client) {
    if (!client.user) {
      console.error('❌ Bot pronto, mas client.user não definido!')
      return
    }

    const now = new Date().toLocaleString('pt-BR')
    console.log(`✅ [${now}] Bot logado como ${client.user.tag} (ID: ${client.user.id})`)

    // Define um "status/presença" para o bot
    client.user.setPresence({
      activities: [{ name: 'Pix Bot 💸', type: ActivityType.Playing }],
      status: 'online'
    })
  }
}
