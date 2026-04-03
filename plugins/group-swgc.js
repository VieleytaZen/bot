const { 
    generateWAMessageContent, 
    generateWAMessageFromContent, 
    proto 
} = require("@adiwajshing/baileys");
const crypto = require("crypto");

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    // 1. Validasi Grup
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

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
            if (!media) throw "Gagal mendownload media! Pastikan file belum kadaluwarsa.";

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

        await m.reply(`_Sedang mengirim Status Grup... Tunggu ya, Viel lagi proses!_`);

        // 4. Penentuan Target Grup (Fitur Khusus Owner)
        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

        // 5. Konstruksi Group Status Message V2
        const messageSecret = crypto.randomBytes(32);
        
        // Menggunakan helper upload dari koneksi bot
        const msgContent = await generateWAMessageContent(content, {
            upload: conn.waUploadToServer,
        });

        const message = generateWAMessageFromContent(
            targetGc,
            {
                messageContextInfo: { messageSecret },
                groupStatusMessageV2: {
                    message: {
                        ...msgContent,
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
        console.error("Error SWGC Plugin:", e);
        m.reply(`❌ *Gagal:* ${e.message || e}`);
    }
};

handler.help = ["swgc", "upswgc"];
handler.tags = ["owner", "group"];
handler.command = /^(swgc|upswgc)$/i;
handler.admin = true;
handler.group = true;

module.exports = handler;
