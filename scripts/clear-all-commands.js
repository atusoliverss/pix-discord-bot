// scripts/clear-all-commands.js
require('dotenv').config()
const { REST, Routes } = require('discord.js')

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN e CLIENT_ID são obrigatórios no .env')
  process.exit(1)
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)

;(async () => {
  try {
    console.log('🧹 Limpando comandos GLOBAIS...')
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
    console.log('✅ Comandos globais limpos.')

    if (GUILD_ID) {
      console.log(`🧹 Limpando comandos da guild ${GUILD_ID}...`)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
      console.log('✅ Comandos da guild limpos.')
    }
  } catch (e) {
    console.error('❌ Erro limpando comandos:', e)
  }
})()
