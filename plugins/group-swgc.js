const crypto = require("crypto");

// --- INTERNAL BAILEYS LOADER (FIXED) ---
let baileysData = null;
const loadBaileysInternal = async () => {
    if (!baileysData) {
        try {
            // Kita coba panggil library yang terpasang
            const baileys = require("@adiwajshing/baileys");
            
            // Pada versi baru, terkadang fungsi ada di dalam properti 'default'
            const root = baileys.default || baileys;
            
            baileysData = {
                generateWAMessageContent: root.generateWAMessageContent,
                generateWAMessageFromContent: root.generateWAMessageFromContent,
                proto: root.proto,
            };

            if (!baileysData.generateWAMessageContent) {
                throw new Error("Fungsi generateWAMessageContent tidak ditemukan.");
            }
        } catch (e) {
            console.error("Gagal memuat modul Baileys:", e);
            throw "Gagal memuat library Baileys. Pastikan struktur modul benar!";
        }
    }
    return baileysData;
};

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    // 1. Validasi: Hanya untuk Grup
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    // Muat fungsi internal Baileys
    const { generateWAMessageContent, generateWAMessageFromContent } = await loadBaileysInternal();

    // 2. Tentukan sumber media
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || "";
    let caption = text ? text.trim() : "";

    try {
        let content = {};
        let isMedia = /image|video|audio/.test(mime);

        // 3. Logika Penentuan Konten
        if (isMedia) {
            const media = await q.download?.();
            if (!media) throw "Gagal mendownload media!";

            if (/image/.test(mime)) {
                content = { image: media, caption };
            } else if (/video/.test(mime)) {
                content = { video: media, caption };
            } else if (/audio/.test(mime)) {
                content = { audio: media, mimetype: "audio/mpeg", ptt: false };
            }
        } else if (caption) {
            content = { text: caption };
        } else {
            throw `*Cara Pakai:* \nReply foto/video atau ketik teks dengan perintah *${prefix + command}*`;
        }

        await m.reply(`_Sedang mengirim Status Grup..._`);

        // 4. Penentuan Target Grup (Fitur khusus Owner)
        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().includes("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

        // 5. Konstruksi Group Status Message V2
        // Kita gunakan waUploadToServer dari koneksi utama
        const inside = await generateWAMessageContent(content, {
            upload: conn.waUploadToServer,
        });

        const messageSecret = crypto.randomBytes(32);
        const message = generateWAMessageFromContent(
            targetGc,
            {
                messageContextInfo: { messageSecret },
                groupStatusMessageV2: {
                    message: {
                        ...inside,
                        messageContextInfo: { messageSecret },
                    },
                },
            },
            {}
        );

        // 6. Pengiriman menggunakan RelayMessage
        await conn.relayMessage(targetGc, message.message, {
            messageId: message.key.id,
        });

        // Beri reaksi sukses
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        m.reply(`❌ *Gagal:* ${e.message || e}`);
    }
};

handler.help = ["swgc", "upswgc"];
handler.tags = ["owner", "group"];
handler.command = /^(swgc|upswgc)$/i;
handler.admin = true;
handler.group = true;

module.exports = handler;
