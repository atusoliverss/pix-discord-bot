// src/commands/pix/handler.js
const { AttachmentBuilder } = require('discord.js')

// importamos helpers/services (assumimos que você os criará conforme nomes abaixo)
const { validateAmount, detectKeyType, normalizePhoneIfNeeded } = require('../../services/pix/validation')
const { buildPixPayload } = require('../../services/pix/payload')
const { generateTxid } = require('../../services/pix/txid')
const { payloadToPngBuffer } = require('../../services/pix/qrcode')
const { createPixEmbed } = require('../../ui/embeds')
const env = require('../../config/env') // aqui esperamos exportar PIX_MERCHANT_NAME/PIX_MERCHANT_CITY

/**
 * Handler do submit da modal 'pixModal'.
 * Exportamos um objeto com customId e a função handle para facilitar o roteamento.
 */
module.exports = {
  customId: 'pixModal',

  /**
   * interaction: ModalSubmitInteraction
   */
  async handle(interaction) {
    try {
      // 1) ler campos enviados pelo usuário (os customIds definidos no modal)
      const rawValor = interaction.fields.getTextInputValue('valor').trim()
      const rawChave = interaction.fields.getTextInputValue('chavepix').trim()

      // 2) validar e normalizar valor
      // aceita tanto "10.50" quanto "10,50" -> substituir vírgula por ponto
      const valorNormalized = rawValor.replace(',', '.')
      const amount = parseFloat(valorNormalized)
      if (!validateAmount(amount)) {
        // resposta curta e visível só pro usuário (ephemeral)
        return interaction.reply({ content: 'Valor inválido. Insira um número maior que zero (ex: 10.50).', ephemeral: true })
      }

      // 3) detectar tipo da chave e normalizar telefone se necessário
      const keyType = detectKeyType(rawChave) // ex: 'E-mail', 'CPF', 'Celular', 'EVP', ...
      let chave = rawChave
      if (keyType === 'Celular') {
        // opcional: normalizar para formato E.164 (+55...)
        chave = normalizePhoneIfNeeded(rawChave)
      }

      // 4) gerar txid (único por cobrança/QR — aqui só um identificador curto)
      const txid = generateTxid()

      // 5) montar o payload BR Code (EMV) do Pix (a lógica fica em services/pix/payload)
      const payload = buildPixPayload({
        chave,
        amount,
        merchantName: env.PIX_MERCHANT_NAME,
        merchantCity: env.PIX_MERCHANT_CITY,
        txid,
        description: 'Pagamento via Discord'
      })

      // 6) converter o payload para imagem PNG (Buffer)
      const pngBuffer = await payloadToPngBuffer(payload)

      // 7) preparar attachments (imagem do QR e um brcode.txt para cópia se o usuário quiser)
      const qrAttachment = new AttachmentBuilder(pngBuffer, { name: 'pix.png' })
      const brcodeAttachment = new AttachmentBuilder(Buffer.from(payload, 'utf8'), { name: 'brcode.txt' })

      // 8) montar um embed bonito com informações (função em ui/embeds)
      const embed = createPixEmbed({
        amount,
        chave,
        keyType,
        txid
      })

      // 9) responder ao usuário (ephemeral: só ele vê)
      await interaction.reply({
        ephemeral: true,
        embeds: [embed],
        files: [qrAttachment, brcodeAttachment]
      })
    } catch (err) {
      console.error('[pix:handler] erro ao processar modal submit:', err)
      // tenta responder com uma mensagem de erro (sempre ephemeral)
      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: 'Erro interno ao gerar o QR. Tente novamente mais tarde.', ephemeral: true }).catch(() => {})
      } else {
        interaction.reply({ content: 'Erro interno ao gerar o QR. Tente novamente mais tarde.', ephemeral: true }).catch(() => {})
      }
    }
  }
}
