// src/events/interactionCreate.js
// Lida com slash commands e botões

const env = require('../config/env')
const { buildPixPayload } = require('../services/pix/payload')

// pega campo de embed por nome (case-insensitive)
function getEmbedField(embed, fieldName) {
  if (!embed || !Array.isArray(embed.fields)) return null
  const target = (fieldName || '').toLowerCase()
  return embed.fields.find(f => (f?.name || '').toLowerCase() === target) || null
}

// "R$ 10,50" -> 10.50
function parseBRLToNumber(text) {
  if (!text) return NaN
  const cleaned = String(text).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')
  return parseFloat(cleaned)
}

module.exports = {
  name: 'interactionCreate',
  once: false,

  async execute(interaction, client) {
    // Slash
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName)
      if (!command) {
        return interaction.reply({ content: '❌ Comando não encontrado!', ephemeral: true })
      }
      try {
        await command.execute(interaction, client)
      } catch (error) {
        console.error('Erro ao executar comando:', error)
        const payload = { content: '⚠️ Ocorreu um erro ao executar este comando.', ephemeral: true }
        interaction.replied || interaction.deferred
          ? interaction.followUp(payload).catch(() => {})
          : interaction.reply(payload).catch(() => {})
      }
      return
    }

    // Botões
    if (interaction.isButton && interaction.isButton()) {
      const { customId } = interaction

      // Copiar BR Code (reconstrói a partir do embed)
      if (customId === 'copy_brcode') {
        try {
          const msg = interaction.message
          const embed = msg?.embeds?.[0]
          if (!embed) {
            return interaction.reply({ content: '⚠️ Não encontrei dados do pagamento nesta mensagem.', ephemeral: true })
          }

          const valorField = getEmbedField(embed, 'Valor')
          const chaveField = getEmbedField(embed, 'Chave Pix')
          const txidField  = getEmbedField(embed, 'TXID')

          const amount = parseBRLToNumber(valorField?.value)
          const chave  = (chaveField?.value || '').replace(/`/g, '')
          const txid   = (txidField?.value || '').trim()

          if (!chave || !isFinite(amount) || amount <= 0) {
            return interaction.reply({ content: '⚠️ Dados insuficientes para reconstruir o BR Code.', ephemeral: true })
          }

          const payload = buildPixPayload({
            chave,
            amount,
            merchantName: env.PIX_MERCHANT_NAME,
            merchantCity: env.PIX_MERCHANT_CITY,
            txid,
            description: 'Pagamento via Discord',
            static: true
          })

          return interaction.reply({
            ephemeral: true,
            content: `Aqui está o BR Code (copie e cole no app do banco):\n\`\`\`\n${payload}\n\`\`\``
          })
        } catch (err) {
          console.error('Erro ao copiar BR Code:', err)
          const payload = { content: '⚠️ Não foi possível gerar o BR Code agora.', ephemeral: true }
          return interaction.replied || interaction.deferred
            ? interaction.followUp(payload).catch(() => {})
            : interaction.reply(payload).catch(() => {})
        }
      }

      // Gerar outro -> dica de uso do slash
      if (customId === 'new_qr') {
        return interaction.reply({
          ephemeral: true,
          content: 'Para gerar outro QR, use: **/pix tipo:<Celular/CPF/CNPJ/E-mail/EVP> valor:<10.50> chavepix:<sua chave>**'
        })
      }

      return
    }
  }
}
