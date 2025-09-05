// src/commands/pix/handler.js
const { AttachmentBuilder } = require('discord.js')
const {
  validateAmount,
  normalizePhoneIfNeeded,
  isValidCPF,
  isValidCNPJ,
  onlyDigits,
  isBrazilCellphoneDigitsStrict,
  isBrazilCellphoneDigitsNational
} = require('../../services/pix/validation')
const { buildPixPayload } = require('../../services/pix/payload')
const { generateTxid } = require('../../services/pix/txid')
const { payloadToPngBuffer } = require('../../services/pix/qrcode')
const { createPixEmbed, createPixButtons } = require('../../ui/embeds')
const env = require('../../config/env')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

module.exports = {
  customId: 'pixModal',

  /** @param {import('discord.js').ModalSubmitInteraction} interaction */
  async handle(interaction) {
    try {
      const [, tipoRaw] = String(interaction.customId || '').split(':')
      const tipo = (tipoRaw || 'CELULAR').toUpperCase()

      const rawValor = interaction.fields.getTextInputValue('valor').trim()
      const rawChave = interaction.fields.getTextInputValue('chavepix').trim()

      const amount = parseFloat(rawValor.replace(',', '.'))
      if (!validateAmount(amount)) {
        return interaction.reply({
          content: 'Valor inválido. Use um número maior que zero, ex.: 10.50.',
          ephemeral: true
        })
      }

      let chave = rawChave
      let keyTypeHuman = 'Chave Pix'

      if (tipo === 'EMAIL') {
        // ↓↓↓ Normaliza e-mail para minúsculo
        chave = chave.toLowerCase().trim()
        if (!EMAIL_RE.test(chave)) {
          return interaction.reply({ content: 'E-mail inválido.', ephemeral: true })
        }
        keyTypeHuman = 'E-mail'

      } else if (tipo === 'EVP') {
        if (!UUID_RE.test(chave)) {
          return interaction.reply({ content: 'Chave aleatória (EVP) inválida. Informe um UUID.', ephemeral: true })
        }
        keyTypeHuman = 'EVP'

      } else if (tipo === 'CPF') {
        const d = onlyDigits(chave)
        if (!isValidCPF(d)) {
          return interaction.reply({ content: 'CPF inválido.', ephemeral: true })
        }
        chave = d
        keyTypeHuman = 'CPF'

      } else if (tipo === 'CNPJ') {
        const d = onlyDigits(chave)
        if (!isValidCNPJ(d)) {
          return interaction.reply({ content: 'CNPJ inválido.', ephemeral: true })
        }
        chave = d
        keyTypeHuman = 'CNPJ'

      } else { // CELULAR
        const digits = onlyDigits(chave)

        if (chave === '+55' || digits === '55') {
          return interaction.reply({
            content: 'Número incompleto. Use **+55DD9XXXXXXXXX** (ex.: +5511999998888).',
            ephemeral: true
          })
        }

        const isIntl = isBrazilCellphoneDigitsStrict(digits)       // 55 + 11
        let isNat = false

        // Só aceita 11 dígitos nacionais se NÃO for CPF válido e tiver 3º dígito = 9
        if (!isIntl && digits.length === 11) {
          if (isValidCPF(digits)) {
            return interaction.reply({
              content: 'Isso parece um **CPF**. Selecione o tipo **CPF** para continuar.',
              ephemeral: true
            })
          }
          if (isBrazilCellphoneDigitsNational(digits)) {
            isNat = true
          }
        }

        if (!isIntl && !isNat) {
          return interaction.reply({
            content: 'Celular inválido. Use **+55DD9XXXXXXXXX** ou informe **DDD+9+número** (ex.: 11999998888).',
            ephemeral: true
          })
        }

        // normaliza para +55DD9XXXXXXXXX
        chave = normalizePhoneIfNeeded(chave)
        keyTypeHuman = 'Celular'
      }

      const txid = generateTxid()

      const payload = buildPixPayload({
        chave,
        amount,
        merchantName: env.PIX_MERCHANT_NAME,
        merchantCity: env.PIX_MERCHANT_CITY,
        txid,
        description: 'Pagamento via Discord',
        static: true
      })

      const pngBuffer = await payloadToPngBuffer(payload)
      const qrAttachment = new AttachmentBuilder(pngBuffer, { name: 'pix.png' })

      const embed = createPixEmbed({ amount, chave, keyType: keyTypeHuman, txid })

      return interaction.reply({
        ephemeral: true,
        embeds: [embed],
        files: [qrAttachment],
        components: [createPixButtons()]
      })
    } catch (err) {
      console.error('[pix:handler] erro ao processar modal submit:', err)
      const payload = { content: 'Erro interno ao gerar o QR. Tente novamente mais tarde.', ephemeral: true }
      if (interaction.replied || interaction.deferred) return interaction.followUp(payload).catch(() => {})
      return interaction.reply(payload).catch(() => {})
    }
  }
}
