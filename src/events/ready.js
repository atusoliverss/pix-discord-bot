// src/events/ready.js
// Evento disparado quando o bot fica online (conectado ao Discord)

const { ActivityType } = require('discord.js')
const { logInfo, logError } = require('../config/logger')

module.exports = {
  name: 'ready',
  once: true,

  execute(client) {
    if (!client.user) {
      logError('Bot pronto, mas client.user não definido!', 'ready')
      return
    }

    logInfo(
      `Bot logado como ${client.user.tag} (ID: ${client.user.id})`,
      'ready'
    )

    // Define um "status/presença" para o bot
    client.user.setPresence({
      activities: [{ name: 'Pix Bot 💸', type: ActivityType.Playing }],
      status: 'online'
    })
  }
}
