// scripts/clear-all-commands.js
// Limpa todos os comandos: globais + guilds definidas no .env

require('dotenv').config()
const { REST, Routes } = require('discord.js')

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,    // opcional: 1 guild
  GUILD_IDS    // opcional: lista separada por vírgula
} = process.env

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN e CLIENT_ID são obrigatórios no .env')
  process.exit(1)
}

// prepara lista de guilds (GUILD_IDS > GUILD_ID > vazio)
const guildIds = (GUILD_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)

;(async () => {
  try {
    // limpa globais
    console.log('🧹 Limpando comandos GLOBAIS...')
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
    console.log('✅ Comandos globais limpos.')

    // limpa guilds
    const targets = guildIds.length > 0 ? guildIds : (GUILD_ID ? [GUILD_ID] : [])
    for (const gid of targets) {
      console.log(`🧹 Limpando comandos da guild ${gid}...`)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, gid), { body: [] })
      console.log(`✅ Guild ${gid}: comandos limpos.`)
    }

    if (targets.length === 0) {
      console.log('ℹ️ Nenhuma guild definida em GUILD_ID/GUILD_IDS, apenas os comandos globais foram limpos.')
    }
  } catch (e) {
    console.error('❌ Erro limpando comandos:', e?.response?.data ?? e)
    process.exit(1)
  }
})()
