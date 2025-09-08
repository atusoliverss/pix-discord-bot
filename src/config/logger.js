// src/config/logger.js
// Logger simples, com níveis padronizados e timestamp ISO

const LEVELS = {
  info:  'INFO',
  warn:  'WARN',
  error: 'ERROR',
  debug: 'DEBUG'
}

function ts() {
  return new Date().toISOString()
}

/**
 * Monta a string base do log.
 * Ex.: "2025-09-07T22:31:00.000Z [INFO] [pix:handler] mensagem"
 */
function line(level, msg, context) {
  const prefix = context ? `[${context}] ` : ''
  return `${ts()} [${level}] ${prefix}${msg}`
}

function logInfo(msg, context = '', ...args) {
  console.log('ℹ️', line(LEVELS.info, msg, context), ...args)
}

function logWarn(msg, context = '', ...args) {
  console.warn('⚠️', line(LEVELS.warn, msg, context), ...args)
}

function logError(msg, context = '', ...args) {
  console.error('❌', line(LEVELS.error, msg, context), ...args)
}

function logDebug(msg, context = '', ...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('🐞', line(LEVELS.debug, msg, context), ...args)
  }
}

module.exports = { logInfo, logWarn, logError, logDebug }
