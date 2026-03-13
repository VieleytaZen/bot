var handler = async (m, { conn }) => {
    // Ambil data dari config
    let name = global.nameowner
    let number = global.numberowner
    let gmail = global.mail
    let instagram = global.instagram

    // Pastikan nomor bersih dari karakter aneh, tapi tetap string
    let cleanNumber = number.replace(/[^0-9]/g, '')

    const vcard = `BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
ORG:Creator Bot
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
item1.EMAIL;type=INTERNET:${gmail}
item1.X-ABLabel:Email Owner
item2.URL:${instagram}
item2.X-ABLabel:Instagram
item3.ADR:;;🇮🇩 Indonesia;;;;
item3.X-ABADR:ac
END:VCARD`

    // Mengirim pesan kontak
    await conn.sendMessage(
        m.chat,
        {
            contacts: {
                displayName: name,
                contacts: [{ vcard }]
            }
        },
        { quoted: m }
    )
    
    // Pesan tambahan untuk memastikan user bisa klik nomor jika vCard gagal
    await conn.reply(m.chat, `Itu adalah nomor owner Bot.\nJika tombol chat tidak muncul, klik di sini: wa.me/${cleanNumber}`, m)
}

handler.command = handler.help = ['owner', 'creator'];
handler.tags = ['info'];
handler.limit = false;

module.exports = handler;