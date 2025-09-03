// src/utils/logger.js
// Logger simples com níveis e timestamp. Evita console.log solto pelo projeto.

const LEVELS = {
  debug: 'DEBUG',
  info:  'INFO',
  warn:  'WARN',
  error: 'ERROR'
}

function ts() {
  return new Date().toISOString()
}

const useEmoji = process.env.LOG_EMOJI !== 'false' // pode desligar com LOG_EMOJI=false

function log(level, emoji, ...args) {
  const msg = `[${LEVELS[level] || level}] ${ts()}`
  if (!useEmoji) emoji = ''
  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV !== 'production') console.debug(`${emoji} ${msg}`, ...args)
      break
    case 'info':
      console.log(`${emoji} ${msg}`, ...args)
      break
    case 'warn':
      console.warn(`${emoji} ${msg}`, ...args)
      break
    case 'error':
      console.error(`${emoji} ${msg}`, ...args)
      break
    default:
      console.log(`${emoji} ${msg}`, ...args)
  }
}

function debug(...args) { log('debug', '🐞', ...args) }
function info(...args)  { log('info',  'ℹ️ ', ...args) }
function warn(...args)  { log('warn',  '⚠️ ', ...args) }
function error(...args) { log('error', '❌', ...args) }

module.exports = {
  debug,
  info,
  warn,
  error,
  log,    // genérico
  LEVELS  // exportado caso precise
}
