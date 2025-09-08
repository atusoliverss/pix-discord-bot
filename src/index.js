// src/index.js
// Arquivo principal do bot (ponto de entrada)

const fs = require('fs')
const path = require('path')
const { Client, Collection, GatewayIntentBits } = require('discord.js')
const env = require('./config/env')
const log = require('./utils/logger')

// ---------------- Client ----------------
// Para slash commands apenas: Guilds.
// Para prefixo (!messageCreate): precisa GuildMessages + MessageContent.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,   // necessário p/ evento messageCreate
    GatewayIntentBits.MessageContent   // necessário p/ ler o conteúdo "!" dos msgs
  ]
})

// Coleção de comandos (Map)
client.commands = new Collection()

// ---------------- Helpers ----------------
function safeReaddir(dir) {
  try {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
  } catch (e) {
    log.error(`Falha ao ler diretório: ${dir}`, 'index', e)
    return []
  }
}

function walkFiles(root, list = []) {
  const entries = safeReaddir(root)
  for (const name of entries) {
    const full = path.join(root, name)
    let stat
    try {
      stat = fs.lstatSync(full)
    } catch (e) {
      log.warn(`Ignorando entrada inválida: ${full}`, 'index', e)
      continue
    }
    if (stat.isDirectory()) {
      walkFiles(full, list)
    } else if (name.endsWith('.js')) {
      list.push(full)
    }
  }
  return list
}

// ---------------- Carregar COMANDOS ----------------
;(function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands')
  const files = walkFiles(commandsPath)

  if (!files.length) {
    log.warn('Nenhum comando encontrado em src/commands.', 'index')
  }

  const seen = new Set()

  for (const file of files) {
    try {
      const command = require(file)
      if (command?.data?.name && typeof command.execute === 'function') {
        if (seen.has(command.data.name)) {
          log.warn(`Comando duplicado detectado e ignorado: ${command.data.name} (${file})`, 'index')
          continue
        }
        client.commands.set(command.data.name, command)
        seen.add(command.data.name)
        log.info(`Comando carregado: ${command.data.name}`, 'index')
      } else {
        log.warn(`Arquivo de comando ignorado (sem { data, execute }): ${file}`, 'index')
      }
    } catch (e) {
      log.error(`Erro ao carregar comando: ${file}`, 'index', e)
    }
  }

  log.info(`Total de comandos ativos: ${client.commands.size}`, 'index')
})()

// ---------------- Carregar EVENTOS ----------------
;(function loadEvents() {
  const eventsPath = path.join(__dirname, 'events')
  const files = safeReaddir(eventsPath).filter(f => f.endsWith('.js'))

  if (!files.length) {
    log.warn('Nenhum evento encontrado em src/events.', 'index')
  }

  for (const file of files) {
    const full = path.join(eventsPath, file)
    try {
      const event = require(full)
      if (!event?.name || typeof event.execute !== 'function') {
        log.warn(`Arquivo de evento ignorado (sem { name, execute }): ${full}`, 'index')
        continue
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client))
      } else {
        client.on(event.name, (...args) => event.execute(...args, client))
      }
      log.info(`Evento registrado: ${event.name}`, 'index')
    } catch (e) {
      log.error(`Erro ao registrar evento: ${full}`, 'index', e)
    }
  }
})()

// ---------------- Hardening de processo ----------------
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection', 'index', reason)
})
process.on('uncaughtException', (err) => {
  log.error('Uncaught Exception', 'index', err)
})

// Encerramento gracioso
function shutdown(sig) {
  log.warn(`Recebido ${sig}. Encerrando...`, 'index')
  client.destroy()
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ---------------- Login do bot ----------------
client.login(env.DISCORD_TOKEN)
  .then(() => log.info('Bot inicializando...', 'index'))
  .catch(err => {
    log.error('Erro ao logar no Discord', 'index', err)
    process.exit(1)
  })

module.exports = { client }
