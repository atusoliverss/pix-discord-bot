// src/config/commands.js
const env = require('./env')

module.exports = {
  deploy: {
    guildId: env.GUILD_ID,     // comandos só ficam disponíveis nesse servidor
    clientId: env.CLIENT_ID,   // id da aplicação
  }
}
