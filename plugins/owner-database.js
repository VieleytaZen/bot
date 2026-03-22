/* let fs = require('fs')
let handler  = async (m, { conn, text }) => {
m.reply('Tunggu Sebentar, Proses Getting File database.json')
let db = fs.readFileSync('./database.json')
conn.sendMessage(m.chat, { document: db, mimetype: 'application/json', fileName: 'database.json' }, { quoted: m })
}
handler.help = ['getdb','getdatabase'].map(v => v + ' <teks>')
handler.tags = ['owner']
handler.command = /^(db|getdb)$/i
handler.owner = true
handler.mods = false
handler.premium = false
handler.group = false
handler.private = false

handler.admin = false
handler.botAdmin = false

handler.fail = null

module.exports = handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

const randomID = length => require('crypto').randomBytes(Math.ceil(length * .5)).toString('hex').slice(0, length)
*/

let fs = require('fs')

let handler = m => m
handler.all = async function (m) {
    // Inisialisasi objek autosave di instance bot (this) agar tidak duplikat
    this.autosave = this.autosave ? this.autosave : {}
    
    // Interval 1 jam (3600000 ms)
    const interval = 60000 

    // Cek apakah timer sudah berjalan atau belum
    if (!this.autosave.timer) {
        console.log('Starting auto-backup database (CJS Mode)...')
        
        this.autosave.timer = setInterval(async () => {
            try {
                let dbPath = './database.json'
                
                if (fs.existsSync(dbPath)) {
                    let db = fs.readFileSync(dbPath)
                    let time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                    
                    // Mengambil nomor owner dari global.owner di config.js
                    // Kita bersihkan nomornya (takutnya di config ada yang pakai @s.whatsapp.net ada yang tidak)
                    let target = global.owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                    
                    await this.sendMessage(target, { 
                        document: db, 
                        mimetype: 'application/json', 
                        fileName: `database_${time.replace(/[/:\s]/g, '-')}.json`,
                        caption: `*✨ AUTO BACKUP DATABASE*\n\n📅 *Waktu:* ${time}\n👤 *Owner:* ${global.nameowner}\n📦 *Status:* Berhasil terkirim.`
                    }, { quoted: null })
                    
                    console.log(`[${time}] Auto-backup sent to ${global.owner[0]}`)
                } else {
                    console.log('File database.json tidak ditemukan untuk backup.')
                }
            } catch (e) {
                console.error('Auto-backup error:', e)
            }
        }, interval)
    }
}

module.exports = handler

