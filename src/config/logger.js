// src/config/logger.js
// Logger simples com níveis padronizados e timestamp ISO

function ts() {
  return new Date().toISOString()
}

function logInfo(msg, ...args) {
  console.log(`ℹ️  [INFO]  ${ts()} - ${msg}`, ...args)
}

function logWarn(msg, ...args) {
  console.warn(`⚠️  [WARN]  ${ts()} - ${msg}`, ...args)
}

function logError(msg, ...args) {
  console.error(`❌ [ERROR] ${ts()} - ${msg}`, ...args)
}

function logDebug(msg, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`🐞 [DEBUG] ${ts()} - ${msg}`, ...args)
  }
}

module.exports = { logInfo, logWarn, logError, logDebug }
