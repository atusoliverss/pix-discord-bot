// src/config/logger.js
function logInfo(msg) {
  console.log(`ℹ️ [INFO] ${new Date().toISOString()} - ${msg}`)
}

function logError(msg) {
  console.error(`❌ [ERROR] ${new Date().toISOString()} - ${msg}`)
}

module.exports = { logInfo, logError }
