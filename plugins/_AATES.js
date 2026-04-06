let handler = async (m, { conn }) => {
  conn.reply(m.chat, `${m.sender}\n\n ${fakeMsg.key.participant}`, m)
}

handler.command = ['sts']

module.exports = handler
