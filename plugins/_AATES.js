let handler = async (m, { conn }) => {
  conn.reply(m.chat, m.sender, m)
}

handler.command = ['sts']

module.exports = handler
