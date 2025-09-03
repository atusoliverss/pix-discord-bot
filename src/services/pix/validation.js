// src/services/pix/validation.js
// helpers para validar e normalizar valores e chaves Pix

/**
 * Valida se o amount é um número > 0 e tem no máximo 2 casas decimais.
 * Recebe um Number (ex: 10.5) e retorna true/false.
 */
function validateAmount(amount) {
  if (typeof amount !== 'number') return false
  if (!isFinite(amount) || amount <= 0) return false

  // garantir no máximo 2 casas decimais (representação monetária)
  const parts = amount.toString().split('.')
  if (parts[1] && parts[1].length > 2) return false

  return true
}

/**
 * Detecta tipo da chave Pix com base em regex simples.
 * Retorna uma string descritiva: 'E-mail', 'CPF', 'CNPJ', 'Celular', 'EVP' (aleatória) ou 'Chave desconhecida'
 */
function detectKeyType(chave) {
  if (!chave || typeof chave !== 'string') return 'Chave desconhecida'
  const k = chave.trim()

  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const cpf = /^\d{11}$/
  const cnpj = /^\d{14}$/
  // aceita +55 ou sem +, 10 ou 11 dígitos (com DDD)
  const phone = /^(\+?55)?\d{10,11}$/
  // uuid-like (evp aleatória tem formato uuid em muitos casos)
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (email.test(k)) return 'E-mail'
  if (cpf.test(k)) return 'CPF'
  if (cnpj.test(k)) return 'CNPJ'
  if (phone.test(k)) return 'Celular'
  if (uuid.test(k)) return 'EVP' // chave aleatória no padrão UUID
  return 'Chave Pix'
}

/**
 * Normaliza telefone para formato E.164 com +55 se possível.
 * Se o input já tem +55 ou 55, mantém; se não consegue reconhecer, retorna o original.
 */
function normalizePhoneIfNeeded(chave) {
  if (!chave || typeof chave !== 'string') return chave
  const only = chave.replace(/\D/g, '') // só dígitos

  // se já vem com DDI 55 (ex: 5511999998888) -> adiciona + na frente
  if (only.length === 13 && only.startsWith('55')) {
    return `+${only}`
  }

  // telefone nacional com DDD: 10 ou 11 dígitos -> assume +55
  if (only.length === 10 || only.length === 11) {
    return `+55${only}`
  }

  // se veio com 12 e sem 55 (ex: 01199998888) -> devolve original limpo
  return chave
}

module.exports = {
  validateAmount,
  detectKeyType,
  normalizePhoneIfNeeded
}
