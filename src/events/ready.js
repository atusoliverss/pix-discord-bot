// src/events/ready.js
// Evento disparado quando o bot fica online (conectado ao Discord)

module.exports = {
  name: 'ready',      // nome do evento
  once: true,         // true = escuta apenas 1 vez
  execute(client) {
    console.log(`✅ Bot logado como ${client.user.tag}`)
    // Define um "status/presença" para o bot
    client.user.setPresence({
      activities: [{ name: 'Pix Bot 💸', type: 0 }], // 0 = Playing
      status: 'online'
    })
  }
}
