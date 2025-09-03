// src/utils/discord.js
// Helpers para interações do Discord (respostas seguras, parsing, leitura de embeds)

/**
 * Responde com segurança considerando se a interação já respondeu ou deferiu.
 * Evita "This interaction has already been acknowledged".
 * @param {import('discord.js').Interaction} interaction
 * @param {object} payload
 */
async function safeReply(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(payload)
    }
    return await interaction.reply(payload)
  } catch {
    try {
      return await interaction.followUp(payload)
    } catch {}
  }
}

/**
 * Edita a resposta inicial se possível, caso contrário dá followUp, senão reply.
 * @param {import('discord.js').Interaction} interaction
 * @param {object} payload
 */
async function safeEditOrFollowUp(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(payload)
    }
    return await interaction.reply(payload)
  } catch {
    try {
      return await interaction.followUp(payload)
    } catch {}
  }
}

/**
 * Defer seguro (ephemeral por padrão).
 * @param {import('discord.js').Interaction} interaction
 * @param {boolean} ephemeral
 */
async function safeDefer(interaction, ephemeral = true) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral })
    }
  } catch {}
}

/**
 * Para ComponentInteraction (botões/menus): apenas "acknowledge" sem mensagem.
 * Evita "This interaction failed" no cliente.
 * @param {import('discord.js').Interaction} interaction
 */
async function safeDeferUpdate(interaction) {
  try {
    if ('deferUpdate' in interaction && typeof interaction.deferUpdate === 'function') {
      await interaction.deferUpdate()
    }
  } catch {}
}

/**
 * Atualiza a mensagem do componente se possível, senão faz reply/followUp.
 * @param {import('discord.js').Interaction} interaction
 * @param {object} payload
 */
async function safeUpdate(interaction, payload) {
  try {
    if ('update' in interaction && typeof interaction.update === 'function') {
      return await interaction.update(payload)
    }
    return await safeEditOrFollowUp(interaction, payload)
  } catch {
    return await safeReply(interaction, payload)
  }
}

/**
 * Busca um campo (field) dentro de um Embed por nome (case-insensitive).
 * Retorna o field inteiro ou null.
 */
function getEmbedField(embed, fieldName) {
  if (!embed) return null
  const fields = Array.isArray(embed.fields) ? embed.fields : []
  const target = String(fieldName || '').toLowerCase()
  return fields.find(f => (f?.name || '').toLowerCase() === target) || null
}

/**
 * Converte "R$ 10,50" para Number 10.50.
 * Remove símbolos, troca vírgula por ponto e parseia.
 */
function parseBRLToNumber(text) {
  if (!text) return NaN
  const cleaned = String(text).replace(/[^\d,.\-]/g, '')
  const noThousands = cleaned.replace(/\.(?=\d{3}(?:\D|$))/g, '')
  const final = noThousands.replace(',', '.')
  return parseFloat(final)
}

module.exports = {
  safeReply,
  safeEditOrFollowUp,
  safeDefer,
  safeDeferUpdate,
  safeUpdate,
  getEmbedField,
  parseBRLToNumber
}
