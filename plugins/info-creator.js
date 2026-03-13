// Mengambil data dari global
var name = global.nameowner
var numberowner = global.numberowner
var gmail = global.mail
var instagram = global.instagram // Pastikan ini ada di config.js

var handler = async (m, { conn }) => {
    // Membersihkan nomor dari karakter non-angka agar waid valid
    // Contoh: +62 812... menjadi 62812...
    let cleanNumber = numberowner.replace(/[^0-9]/g, '')

    const vcard = `BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
ORG:Creator Bot;
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
item1.EMAIL;type=INTERNET:${gmail}
item1.X-ABLabel:Email Owner
item2.URL:${instagram}
item2.X-ABLabel:Instagram
item3.ADR:;;🇮🇩 Indonesia;;;;
item3.X-ABADR:ac
END:VCARD`

    const sentMsg = await conn.sendMessage(
        m.chat,
        {
            contacts: {
                displayName: name,
                contacts: [{ vcard }]
            }
        },
        { quoted: m } // Menambahkan quoted agar bot membalas pesanmu
    )

    await conn.reply(m.chat, "Itu adalah nomor owner Bot", sentMsg)
}

handler.command = handler.help = ['owner', 'creator'];
handler.tags = ['info'];
handler.limit = false;

module.exports = handler;