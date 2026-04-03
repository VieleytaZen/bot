const crypto = require("crypto");

// --- LOADER ---
let Baileys;
try {
    // Kita coba panggil WhiskeySockets dulu karena di package.json kamu merujuk ke sana
    Baileys = require("@whiskeysockets/baileys");
} catch {
    try {
        Baileys = require("@adiwajshing/baileys");
    } catch {
        Baileys = require("baileys");
    }
}

const { 
    generateWAMessageContent, 
    generateWAMessageFromContent 
} = Baileys?.default || Baileys || {};

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    // 1. Cek apakah fungsi Baileys ada (Anti Error)
    if (!generateWAMessageContent || !generateWAMessageFromContent) {
        throw "Modul Baileys nggak kebaca, Oki. Coba restart panel/terminalnya!";
    }

    // 2. Validasi Grup
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || "";
    let caption = text ? text.trim() : "";

    try {
        let content = {};
        let isMedia = /image|video|audio/.test(mime);

        if (isMedia) {
            const media = await q.download?.();
            if (!media) throw "Gagal download media!";

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

        await m.reply(`_Sssttt... Viel lagi up Status Grup..._`);

        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

        // --- PROSES PEMBUATAN PESAN ---
        const messageSecret = crypto.randomBytes(32);
        
        // Memakai generateWAMessageContent (Sesuai saran tapi tetap pakai fungsi aslinya)
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

        await conn.relayMessage(targetGc, message.message, {
            messageId: message.key.id,
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        m.reply(`❌ *Error:* ${e.message || e}`);
    }
};

handler.help = ["swgc", "upswgc"];
handler.tags = ["owner", "group"];
handler.command = /^(swgc|upswgc)$/i;
handler.group = true;

module.exports = handler;
