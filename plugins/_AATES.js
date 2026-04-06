let handler = async (m, { conn }) => {
  conn.reply(m.chat, `${m.sender}\n\n ${m.key.participant}`, m)
}

handler.command = ['sts']

module.exports = handler
