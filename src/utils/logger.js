// src/utils/logger.js
// Logger simples com níveis, timestamp e contexto opcional.

const LEVELS = {
  debug: 'DEBUG',
  info:  'INFO',
  warn:  'WARN',
  error: 'ERROR'
}

function ts() {
  return new Date().toISOString()
}

const useEmoji = process.env.LOG_EMOJI !== 'false'

function format(level, context, msg) {
  const ctx = context ? `[${context}] ` : ''
  return `[${LEVELS[level] || level}] ${ts()} ${ctx}${msg}`
}

function log(level, emoji, msg, context = '', ...args) {
  if (!useEmoji) emoji = ''
  const line = format(level, context, msg)

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV !== 'production')
        console.debug(`${emoji} ${line}`, ...args)
      break
    case 'info':
      console.log(`${emoji} ${line}`, ...args)
      break
    case 'warn':
      console.warn(`${emoji} ${line}`, ...args)
      break
    case 'error':
      console.error(`${emoji} ${line}`, ...args)
      break
    default:
      console.log(`${emoji} ${line}`, ...args)
  }
}

// atalhos
function debug(msg, context = '', ...args) { log('debug', '🐞', msg, context, ...args) }
function info(msg, context = '', ...args)  { log('info',  'ℹ️ ', msg, context, ...args) }
function warn(msg, context = '', ...args)  { log('warn',  '⚠️ ', msg, context, ...args) }
function error(msg, context = '', ...args) { log('error', '❌', msg, context, ...args) }

module.exports = {
  debug,
  info,
  warn,
  error,
  log,    // genérico
  LEVELS
}
