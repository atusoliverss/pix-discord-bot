// src/utils/errors.js
// Classe de erro de aplicação para diferenciar erros "previstos" (ex: validação)
// de erros inesperados do sistema.

class AppError extends Error {
  /**
   * @param {string} message - mensagem amigável para o usuário/logs
   * @param {number} [status=400] - código semântico (ex.: 400 validação, 500 interno)
   * @param {string} [code] - código curto para identificar o tipo (ex.: 'VALIDATION', 'PAYLOAD')
   * @param {object} [meta] - dados adicionais úteis para log/debug
   */
  constructor(message, status = 400, code = 'APP_ERROR', meta = {}) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.meta = meta
    this.isOperational = true // flag para erros previstos de negócio

    // mantém stack trace sem poluir com o construtor
    Error.captureStackTrace?.(this, this.constructor)
  }

  /**
   * Serializa o erro em formato simples (para logs ou APIs)
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      meta: this.meta
    }
  }

  // atalhos úteis
  static validation(msg, meta = {}) {
    return new AppError(msg, 400, 'VALIDATION', meta)
  }

  static internal(msg = 'Erro interno no servidor', meta = {}) {
    return new AppError(msg, 500, 'INTERNAL', meta)
  }
}

module.exports = { AppError }
