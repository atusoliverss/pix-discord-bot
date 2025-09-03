// src/events/interactionCreate.js
// Responsável por lidar com slash commands, modals, botões e selects

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const env = require('../config/env')
const pixModalHandler = require('../commands/pix/handler')
const { buildPixPayload } = require('../services/pix/payload')
const { createPixModal } = require('../commands/pix/modal')

// tenta achar um campo no embed pelo nome (case-insensitive)
function getEmbedField(embed, fieldName) {
  if (!embed || !Array.isArray(embed.fields)) return null
  const target = (fieldName || '').toLowerCase()
  return embed.fields.find(f => (f?.name || '').toLowerCase() === target) || null
}

// converte "R$ 10,50" -> 10.50 (Number)
function parseBRLToNumber(text) {
  if (!text) return NaN
  const cleaned = String(text).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')
  return parseFloat(cleaned)
}

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // ---------------- Slash commands ----------------
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName)
      if (!command) {
        await interaction.reply({ content: '❌ Comando não encontrado!', ephemeral: true })
        return
      }
      try {
        await command.execute(interaction, client)
      } catch (error) {
        console.error('Erro ao executar comando:', error)
        const already = interaction.replied || interaction.deferred
        const payload = { content: '⚠️ Ocorreu um erro ao executar este comando.', ephemeral: true }
        already ? interaction.followUp(payload).catch(() => {}) : interaction.reply(payload).catch(() => {})
      }
      return
    }

    // ---------------- Modal submit (/pix) ----------------
    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      try {
        // agora o customId vem como "pixModal:TIPO"
        if (String(interaction.customId || '').startsWith(pixModalHandler.customId)) {
          return await pixModalHandler.handle(interaction)
        }
      } catch (err) {
        console.error('Erro no submit da modal:', err)
        const already = interaction.replied || interaction.deferred
        const payload = { content: '⚠️ Erro ao processar o formulário do Pix.', ephemeral: true }
        already ? interaction.followUp(payload).catch(() => {}) : interaction.reply(payload).catch(() => {})
      }
      return
    }

    // ---------------- Select menu (escolha do tipo) ----------------
    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
      if (interaction.customId === 'pix_type_select') {
        try {
          const tipo = (interaction.values?.[0] || 'CELULAR').toUpperCase()
          const modal = createPixModal(tipo)
          // abrir a modal direto a partir do select
          return await interaction.showModal(modal)
        } catch (err) {
          console.error('Erro ao abrir modal a partir do select:', err)
          const already = interaction.replied || interaction.deferred
          const payload = { content: '⚠️ Não foi possível abrir o formulário agora.', ephemeral: true }
          return already ? interaction.followUp(payload).catch(() => {}) : interaction.reply(payload).catch(() => {})
        }
      }
      return
    }

    // ---------------- Botões ----------------
    if (interaction.isButton && interaction.isButton()) {
      const { customId } = interaction

      // (A) Copiar BR Code
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
          const already = interaction.replied || interaction.deferred
          const payload = { content: '⚠️ Não foi possível gerar o BR Code agora.', ephemeral: true }
          return already ? interaction.followUp(payload).catch(() => {}) : interaction.reply(payload).catch(() => {})
        }
      }

      // (B) Gerar outro QR → abre SELECT para escolher o tipo
      if (customId === 'new_qr') {
        try {
          const select = new StringSelectMenuBuilder()
            .setCustomId('pix_type_select')
            .setPlaceholder('Selecione o tipo de chave Pix')
            .addOptions(
              { label: 'Celular', value: 'CELULAR', description: 'Formato +55DD9XXXXXXXXX ou DDD+9+XXXXXXXX' },
              { label: 'CPF',     value: 'CPF' },
              { label: 'CNPJ',    value: 'CNPJ' },
              { label: 'E-mail',  value: 'EMAIL' },
              { label: 'EVP',     value: 'EVP', description: 'Chave aleatória (UUID)' }
            )

          const row = new ActionRowBuilder().addComponents(select)

          return await interaction.reply({
            ephemeral: true,
            content: 'Escolha o tipo da sua **chave Pix**:',
            components: [row]
          })
        } catch (err) {
          console.error('Erro ao abrir select de tipo do Pix:', err)
          const already = interaction.replied || interaction.deferred
          const payload = { content: '⚠️ Não foi possível abrir a seleção agora.', ephemeral: true }
          return already ? interaction.followUp(payload).catch(() => {}) : interaction.reply(payload).catch(() => {})
        }
      }

      return
    }
  }
}
