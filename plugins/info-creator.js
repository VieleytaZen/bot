var handler = async (m, { conn }) => {
    // 1. Ambil data global
    let name = global.nameowner || 'Owner'
    let rawNumber = global.numberowner || '628xxx' // sesuaikan
    let gmail = global.mail || 'tidak ada'
    let instagram = global.instagram || '-'

    // 2. BERSIHKAN NOMOR: Menghapus semua karakter kecuali angka
    // Dan pastikan tidak ada spasi atau tanda + di awal untuk waid
    let cleanNumber = rawNumber.replace(/[^0-9]/g, '')

    // 3. Susun vCard dengan format yang lebih standar
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
ORG:Creator Bot
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
item1.EMAIL;type=INTERNET:${gmail}
item1.X-ABLabel:Email
item2.URL:${instagram}
item2.X-ABLabel:Instagram
item3.ADR:;;🇮🇩 Indonesia;;;;
item3.X-ABADR:ac
END:VCARD`

    // 4. Kirim Kontak
    const sentMsg = await conn.sendMessage(
        m.chat,
        {
            contacts: {
                displayName: name,
                contacts: [{ vcard }]
            }
        },
        { quoted: m }
    )

    await conn.reply(m.chat, `Itu adalah nomor owner Bot`, sentMsg)
}

handler.command = handler.help = ['owner', 'creator'];
handler.tags = ['info'];
handler.limit = false;

module.exports = handler;