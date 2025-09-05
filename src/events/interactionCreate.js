// src/events/interactionCreate.js
// Lida com slash commands, modals, botões e select de tipo

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const env = require('../config/env')
const pixModalHandler = require('../commands/pix/handler')
const { buildPixPayload } = require('../services/pix/payload')
const { payloadToPngBuffer } = require('../services/pix/qrcode')
const { validateBrcodeCRC, sanitizeBrcode, validateEmvLengths } = require('../services/pix/brcode')
const { createPixModal, createBrcodeModal } = require('../commands/pix/modal')

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
    // Slash
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName)
      if (!command) return interaction.reply({ content: '❌ Comando não encontrado!', ephemeral: true })
      try { await command.execute(interaction, client) }
      catch (error) {
        console.error('Erro ao executar comando:', error)
        const payload = { content: '⚠️ Ocorreu um erro ao executar este comando.', ephemeral: true }
        interaction.replied || interaction.deferred
          ? interaction.followUp(payload).catch(() => {})
          : interaction.reply(payload).catch(() => {})
      }
      return
    }

    // Modal submit (pix / brcode)
    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      try {
        const cid = String(interaction.customId || '')
        // Submit da modal de PIX (valor + chave)
        if (cid.startsWith(pixModalHandler.customId)) {
          return await pixModalHandler.handle(interaction)
        }

        // Submit da modal de BR CODE (copia e cola)
        if (cid === 'brcodeModal') {
          const raw = interaction.fields.getTextInputValue('brcode_text')
          const sanitized = sanitizeBrcode(raw)

          // 1) Comprimentos TLV
          const lenCheck = validateEmvLengths(sanitized)
          if (!lenCheck.ok) {
            return interaction.reply({
              ephemeral: true,
              content: 'BR Code inválido: comprimentos (TLV) inconsistentes. Cole exatamente o "copia e cola" sem alterações.'
            })
          }

          // 2) CRC – apenas valida (não corrige)
          const { ok, expected, got } = validateBrcodeCRC(sanitized)
          if (!ok) {
            return interaction.reply({
              ephemeral: true,
              content: `❌ BR Code inválido: CRC não confere (esperado \`${expected}\`, recebido \`${got}\`). ` +
                       'Certifique-se de colar o código exatamente como gerado pelo banco, sem espaços ou alterações.'
            })
          }

          // 3) Gera QR
          const png = await payloadToPngBuffer(sanitized)
          return interaction.reply({
            ephemeral: true,
            content: 'QR gerado a partir do BR Code.',
            files: [{ attachment: png, name: 'pix_from_brcode.png' }]
          })
        }
      } catch (err) {
        console.error('Erro no submit da modal:', err)
        const payload = { content: '⚠️ Erro ao processar o formulário.', ephemeral: true }
        interaction.replied || interaction.deferred
          ? interaction.followUp(payload).catch(() => {})
          : interaction.reply(payload).catch(() => {})
      }
      return
    }

    // Select menu → abrir modal do tipo escolhido
    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
      if (interaction.customId === 'pix_type_select') {
        try {
          const tipo = (interaction.values?.[0] || 'CELULAR').toUpperCase()
          if (tipo === 'BR_CODE') {
            const modal = createBrcodeModal()
            return await interaction.showModal(modal)
          }
          const modal = createPixModal(tipo)
          return await interaction.showModal(modal)
        } catch (err) {
          console.error('Erro ao abrir modal a partir do select:', err)
          const payload = { content: '⚠️ Não foi possível abrir o formulário agora.', ephemeral: true }
          return interaction.replied || interaction.deferred
            ? interaction.followUp(payload).catch(() => {})
            : interaction.reply(payload).catch(() => {})
        }
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
          if (!embed) return interaction.reply({ content: '⚠️ Não encontrei dados do pagamento nesta mensagem.', ephemeral: true })

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
            chave, amount,
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

      // Abrir modal para colar BR Code
      if (customId === 'brcode_to_qr') {
        try {
          const modal = createBrcodeModal()
          return await interaction.showModal(modal)
        } catch (err) {
          console.error('Erro ao abrir modal BR Code -> QR:', err)
          const payload = { content: '⚠️ Não foi possível abrir o formulário agora.', ephemeral: true }
          return interaction.replied || interaction.deferred
            ? interaction.followUp(payload).catch(() => {})
            : interaction.reply(payload).catch(() => {})
        }
      }

      // "Gerar outro QR" → select com todos os tipos (inclui BR Code)
      if (customId === 'new_qr') {
        try {
          const select = new StringSelectMenuBuilder()
            .setCustomId('pix_type_select')
            .setPlaceholder('Selecione o tipo (chave Pix ou BR Code)')
            .addOptions(
              { label: 'Celular', value: 'CELULAR', description: 'Formato +55DD9XXXXXXXXX ou DDD+9+XXXXXXXX' },
              { label: 'CPF',     value: 'CPF' },
              { label: 'CNPJ',    value: 'CNPJ' },
              { label: 'E-mail',  value: 'EMAIL' },
              { label: 'EVP',     value: 'EVP', description: 'Chave aleatória (UUID)' },
              { label: 'BR Code', value: 'BR_CODE', description: 'Cole o copia-e-cola para gerar QR' }
            )

          const row = new ActionRowBuilder().addComponents(select)

          return await interaction.reply({
            ephemeral: true,
            content: 'Escolha o tipo da entrada:',
            components: [row]
          })
        } catch (err) {
          console.error('Erro ao abrir select de tipo do Pix:', err)
          const payload = { content: '⚠️ Não foi possível abrir a seleção agora.', ephemeral: true }
          return interaction.replied || interaction.deferred
            ? interaction.followUp(payload).catch(() => {})
            : interaction.reply(payload).catch(() => {})
        }
      }
      return
    }
  }
}
