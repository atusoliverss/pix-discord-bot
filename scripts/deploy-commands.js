// scripts/deploy-commands.js
// Publica/atualiza os slash commands em múltiplas guilds (GUILD_IDS),
// em uma única guild (GUILD_ID) ou GLOBALMENTE (flag --global).
//
// Uso:
//  - node scripts/deploy-commands.js --global
//  - node scripts/deploy-commands.js            (usa GUILD_IDS ou GUILD_ID do .env)

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { REST, Routes } = require('discord.js')

const isGlobal = process.argv.includes('--global')

// --- env ---
const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,     // fallback para 1 guild
  GUILD_IDS     // lista separada por vírgula
} = process.env

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ Faltou configurar DISCORD_TOKEN ou CLIENT_ID no .env')
  process.exit(1)
}

// prepara lista de guilds: GUILD_IDS (csv) > GUILD_ID (single) > []
const guildIds = (GUILD_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

if (!isGlobal && guildIds.length === 0 && !GUILD_ID) {
  console.error('❌ Defina GUILD_IDS (ids separados por vírgula) ou GUILD_ID no .env. Ou use --global.')
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
        // cada comando deve exportar { data, execute } e data.toJSON()
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

// valida nomes duplicados
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
      // ---------- GLOBAL ----------
      console.log(`🌐 Publicando ${commands.length} comando(s) GLOBALMENTE para a aplicação ${CLIENT_ID}...`)
      const result = await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      )
      console.log(`✅ Concluído! ${result.length} comando(s) ativos GLOBALMENTE.`)
      console.log('ℹ️ A propagação global pode levar alguns minutos.')
      return
    }

    // ---------- POR GUILD ----------
    const targets = guildIds.length > 0 ? guildIds : [GUILD_ID]
    for (const gid of targets) {
      console.log(`🚀 Publicando ${commands.length} comando(s) na guild ${gid}...`)
      const result = await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, gid),
        { body: commands }
      )
      console.log(`✅ Concluído! ${result.length} comando(s) ativos na guild ${gid}.`)
    }
  } catch (err) {
    console.error('❌ Erro ao registrar comandos:', err?.response?.data ?? err)
    process.exit(1)
  }
})()
