// src/services/pix/validation.js
// helpers para validar e normalizar valores e chaves Pix

function validateAmount(amount) {
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) return false
  const parts = amount.toString().split('.')
  if (parts[1] && parts[1].length > 2) return false
  return true
}

function onlyDigits(str) {
  return String(str || '').replace(/\D/g, '')
}

/** Validação de CPF (dígitos verificadores). */
function isValidCPF(cpf) {
  const d = onlyDigits(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i)
  let check1 = (sum * 10) % 11
  if (check1 === 10) check1 = 0
  if (check1 !== parseInt(d[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i)
  let check2 = (sum * 10) % 11
  if (check2 === 10) check2 = 0
  return check2 === parseInt(d[10], 10)
}

/** Validação de CNPJ (dígitos verificadores). */
function isValidCNPJ(cnpj) {
  const d = onlyDigits(cnpj)
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false

  const calc = (len) => {
    let sum = 0
    let pos = len - 7
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i], 10) * pos--
      if (pos < 2) pos = 9
    }
    const res = sum % 11
    return res < 2 ? 0 : 11 - res
  }

  const dig1 = calc(12)
  if (dig1 !== parseInt(d[12], 10)) return false
  const dig2 = calc(13)
  return dig2 === parseInt(d[13], 10)
}

/** Celular BR estrito: 13 dígitos iniciando com 55 (DDI + DDD + 9 + número). */
function isBrazilCellphoneDigitsStrict(digits) {
  return digits.length === 13 && digits.startsWith('55')
}

/** Celular BR nacional: 11 dígitos e 3º dígito = 9 (DDD + 9 + número). */
function isBrazilCellphoneDigitsNational(digits) {
  return digits.length === 11 && digits[2] === '9'
}

/**
 * Detecta tipo da chave Pix (somente para fluxos genéricos).
 * **Não** usa a regra do 3º dígito = 9 para evitar confundir CPF.
 */
function detectKeyType(chave) {
  if (!chave || typeof chave !== 'string') return 'Chave Pix'
  const k = chave.trim()
  if (k.length === 0 || k.length > 77) return 'Chave Pix'

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (EMAIL_RE.test(k)) return 'E-mail'

  const digits = onlyDigits(k)

  // telefone só é detectado aqui se vier no formato internacional 55+11
  if (isBrazilCellphoneDigitsStrict(digits)) return 'Celular'
  if (digits.length === 11 && isValidCPF(digits)) return 'CPF'
  if (digits.length === 14 && isValidCNPJ(digits)) return 'CNPJ'

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (UUID_RE.test(k)) return 'EVP'

  return 'Chave Pix'
}

/**
 * Normaliza telefone para E.164 (+55...):
 * - 55 + 11 dígitos  -> '+55...'
 * - 11 dígitos com 3º = 9 -> '+55...'
 * Caso contrário, retorna original.
 */
function normalizePhoneIfNeeded(chave) {
  if (!chave || typeof chave !== 'string') return chave
  const digits = onlyDigits(chave)

  if (isBrazilCellphoneDigitsStrict(digits)) {
    return `+${digits}` // +55DD9XXXXXXXXX
  }
  if (isBrazilCellphoneDigitsNational(digits)) {
    return `+55${digits}` // +55DD9XXXXXXXXX
  }
  return chave
}

module.exports = {
  validateAmount,
  detectKeyType,
  normalizePhoneIfNeeded,
  isValidCPF,
  isValidCNPJ,
  onlyDigits,
  isBrazilCellphoneDigitsStrict,
  isBrazilCellphoneDigitsNational
}
