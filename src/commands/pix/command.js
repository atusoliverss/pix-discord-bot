// src/commands/pix/command.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js')
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
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('Gerar QR Code Pix a partir de tipo, valor e chave (sem formulário).')
    .addStringOption(opt =>
      opt.setName('tipo')
        .setDescription('Tipo da chave Pix')
        .setRequired(true)
        .addChoices(
          { name: 'Celular', value: 'CELULAR' },
          { name: 'CPF',     value: 'CPF'     },
          { name: 'CNPJ',    value: 'CNPJ'    },
          { name: 'E-mail',  value: 'EMAIL'   },
          { name: 'EVP',     value: 'EVP'     }
        )
    )
    .addStringOption(opt =>
      opt.setName('valor')
        .setDescription('Valor em BRL (ex.: 10.50 ou 10,50)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('chavepix')
        .setDescription('Informe a chave de acordo com o tipo escolhido (ex.: +551199998888)')
        .setRequired(true)
    ),

  /**
   * Executa o comando e já gera o QR (sem modal).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      const tipo = (interaction.options.getString('tipo') || 'CELULAR').toUpperCase()
      const rawValor = interaction.options.getString('valor').trim()
      const rawChave = interaction.options.getString('chavepix').trim()

      // Valor: aceita "10,50" e "10.50"
      const amount = parseFloat(rawValor.replace(',', '.'))
      if (!validateAmount(amount)) {
        return interaction.reply({ content: 'Valor inválido. Use algo como **10.50**.', ephemeral: true })
      }

      // Valida/normaliza conforme tipo
      let chave = rawChave
      let keyTypeHuman = 'Chave Pix'

      if (tipo === 'EMAIL') {
        chave = chave.toLowerCase()
        if (!EMAIL_RE.test(chave)) {
          return interaction.reply({ content: 'E-mail inválido.', ephemeral: true })
        }
        keyTypeHuman = 'E-mail'

      } else if (tipo === 'EVP') {
        if (!UUID_RE.test(chave)) {
          return interaction.reply({ content: 'Chave aleatória (EVP) inválida. Esperado UUID.', ephemeral: true })
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
            content: 'Número incompleto. Use **+55DD9XXXXXXXXX** ou **DDD9XXXXXXXX** (ex.: 11999998888).',
            ephemeral: true
          })
        }

        const isIntl = isBrazilCellphoneDigitsStrict(digits) // 55 + 11
        let isNat = false

        // Aceita 11 nacionais (DDD + 9 + número). Se for CPF válido, recusa aqui.
        if (!isIntl && digits.length === 11) {
          if (isValidCPF(digits)) {
            return interaction.reply({
              content: 'Isso parece um **CPF**. Selecione o tipo **CPF** para continuar.',
              ephemeral: true
            })
          }
          if (isBrazilCellphoneDigitsNational(digits)) isNat = true
        }

        if (!isIntl && !isNat) {
          return interaction.reply({
            content: 'Celular inválido. Use **+55DD9XXXXXXXXX** ou **DDD9XXXXXXXX**.',
            ephemeral: true
          })
        }

        // Normaliza para +55DD9XXXXXXXXX
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
      console.error('[pix:command] erro ao processar /pix:', err)
      const payload = { content: 'Erro interno ao gerar o QR. Tente novamente mais tarde.', ephemeral: true }
      return interaction.replied || interaction.deferred
        ? interaction.followUp(payload).catch(() => {})
        : interaction.reply(payload).catch(() => {})
    }
  }
}
