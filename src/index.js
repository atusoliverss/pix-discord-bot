// src/index.js
// Arquivo principal do bot (ponto de entrada)

const fs = require('fs')
const path = require('path')
const { Client, Collection, GatewayIntentBits } = require('discord.js')
const env = require('./config/env')
const log = require('./utils/logger')

// ---------------- Client ----------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // suficiente para slash commands
})

// Coleção de comandos (Map)
client.commands = new Collection()

// ---------------- Helpers ----------------
function safeReaddir(dir) {
  try {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
  } catch (e) {
    log.error(`Falha ao ler diretório: ${dir}`, e)
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
      log.warn(`Ignorando entrada inválida: ${full}`, e.message)
      continue
    }
    if (stat.isDirectory()) walkFiles(full, list)
    else if (name.endsWith('.js')) list.push(full)
  }
  return list
}

// ---------------- Carregar COMANDOS ----------------
(function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands')
  const files = walkFiles(commandsPath)

  if (!files.length) {
    log.warn('Nenhum comando encontrado em src/commands.')
  }

  const seen = new Set()

  for (const file of files) {
    try {
      const command = require(file)
      if (command?.data?.name && typeof command.execute === 'function') {
        if (seen.has(command.data.name)) {
          log.warn(`Comando duplicado detectado e ignorado: ${command.data.name} (${file})`)
          continue
        }
        client.commands.set(command.data.name, command)
        seen.add(command.data.name)
        log.info(`Comando carregado: ${command.data.name}`)
      } else {
        log.warn(`Arquivo de comando ignorado (sem { data, execute }): ${file}`)
      }
    } catch (e) {
      log.error(`Erro ao carregar comando: ${file}`, e)
    }
  }

  log.info(`Total de comandos ativos: ${client.commands.size}`)
})()

// ---------------- Carregar EVENTOS ----------------
;(function loadEvents() {
  const eventsPath = path.join(__dirname, 'events')
  const files = safeReaddir(eventsPath).filter(f => f.endsWith('.js'))

  if (!files.length) {
    log.warn('Nenhum evento encontrado em src/events.')
  }

  for (const file of files) {
    const full = path.join(eventsPath, file)
    try {
      const event = require(full)
      if (!event?.name || typeof event.execute !== 'function') {
        log.warn(`Arquivo de evento ignorado (sem { name, execute }): ${full}`)
        continue
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client))
      } else {
        client.on(event.name, (...args) => event.execute(...args, client))
      }
      log.info(`Evento registrado: ${event.name}`)
    } catch (e) {
      log.error(`Erro ao registrar evento: ${full}`, e)
    }
  }
})()

// ---------------- Hardening de processo ----------------
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})
process.on('uncaughtException', (err) => {
  log.error('Uncaught Exception:', err)
})

// ---------------- Login do bot ----------------
client.login(env.DISCORD_TOKEN)
  .then(() => log.info('Bot inicializando...'))
  .catch(err => {
    log.error('Erro ao logar no Discord:', err)
    process.exit(1)
  })

module.exports = { client }
