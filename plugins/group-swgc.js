const crypto = require("crypto");

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    // 1. Validasi Grup
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    // 2. JALUR AMAN: Panggil sesuai nama folder yang ada di package.json kamu
    let Baileys;
    try {
        Baileys = require("@adiwajshing/baileys");
    } catch (e) {
        // Jika masih gagal, kita ambil dari default export
        throw "Folder @adiwajshing/baileys tidak ditemukan. Coba ketik 'npm install' di terminal panel kamu.";
    }

    const { generateWAMessageContent, generateWAMessageFromContent } = Baileys.default || Baileys;

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || "";
    let caption = text ? text.trim() : "";

    try {
        let content = {};
        let isMedia = /image|video|audio/.test(mime);

        if (isMedia) {
            const media = await q.download?.();
            if (!media) throw "Gagal mendownload media! Coba kirim ulang gambarnya.";

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

        const messageSecret = crypto.randomBytes(32);
        
        // Gunakan fungsi upload dari koneksi bot kamu
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
