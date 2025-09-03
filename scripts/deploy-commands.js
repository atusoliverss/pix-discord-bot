// scripts/deploy-commands.js
// Registra/atualiza os slash commands na GUILD (servidor) definida no .env,
// ou globalmente se rodar com a flag --global.

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { REST, Routes } = require('discord.js')

const isGlobal = process.argv.includes('--global')

// --- validação rápida do env ---
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env
if (!DISCORD_TOKEN || !CLIENT_ID || (!isGlobal && !GUILD_ID)) {
  console.error('❌ Faltou configurar DISCORD_TOKEN, CLIENT_ID e (se não usar --global) GUILD_ID no .env')
  process.exit(1)
}

// --- coleta todos os comandos (recursivo em src/commands) ---
const commands = []
const commandsPath = path.join(__dirname, '..', 'src', 'commands')

function walk(dir) {
  if (!fs.existsSync(dir)) return
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.lstatSync(full)
    if (stat.isDirectory()) {
      walk(full)
    } else if (file.endsWith('.js')) {
      try {
        const cmd = require(full)
        // cada comando deve exportar { data, execute }; precisamos do data.toJSON()
        if (cmd?.data?.toJSON) {
          commands.push(cmd.data.toJSON())
          console.log(`➕ Encontrado comando: ${cmd.data.name}`)
        } else {
          console.warn(`⚠️ Ignorando "${full}" (não exporta data.toJSON)`)
        }
      } catch (err) {
        console.error(`❌ Falha ao carregar comando "${full}":`, err.message)
      }
    }
  }
}
walk(commandsPath)

if (commands.length === 0) {
  console.warn('⚠️ Nenhum comando encontrado em src/commands — nada para publicar.')
}

// valida nomes duplicados (o Discord rejeita duplicados na mesma app/guild)
const names = new Set()
for (const c of commands) {
  if (names.has(c.name)) {
    console.warn(`⚠️ Comando duplicado detectado: "${c.name}". Verifique os arquivos em src/commands.`)
  }
  names.add(c.name)
}

// --- publica via REST ---
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)

;(async () => {
  try {
    if (isGlobal) {
      console.log(`🌐 Publicando ${commands.length} comando(s) GLOBALMENTE para a aplicação ${CLIENT_ID}...`)
      const result = await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      )
      console.log(`✅ Concluído! ${result.length} comando(s) ativos GLOBALMENTE.`)
      console.log('ℹ️ A propagação global pode levar alguns minutos.')
    } else {
      console.log(`🚀 Publicando ${commands.length} comando(s) na guild ${GUILD_ID}...`)
      const result = await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      )
      console.log(`✅ Concluído! ${result.length} comando(s) ativos na guild.`)
    }
  } catch (err) {
    console.error('❌ Erro ao registrar comandos:', err?.response?.data ?? err)
    process.exit(1)
  }
})()
