const crypto = require("crypto");

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    try {
        const { loadBaileys } = require("../baileys-loader.mjs");
        const baileys = await loadBaileys();
        const { generateWAMessageContent, generateWAMessageFromContent } = baileys.default || baileys;

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || "";
        let caption = text ? text.trim() : (q.msg?.caption || "");

        let content = {};
        let isMedia = /image|video|audio/.test(mime);

        if (isMedia) {
            const media = await q.download?.();
            if (!media) throw "Gagal download media!";

            // Menggunakan struktur langsung agar tidak "Invalid Media Type"
            if (/image/.test(mime)) {
                content = { image: media, caption: caption };
            } else if (/video/.test(mime)) {
                content = { video: media, caption: caption };
            } else if (/audio/.test(mime)) {
                content = { audio: media, mimetype: 'audio/mp4', ptt: false };
            }
        } else if (caption) {
            content = { text: caption };
        } else {
            throw `*Cara Pakai:* \nReply foto/video dengan perintah *${prefix + command}*`;
        }

        await m.reply(`_Sedang mengirim Status Grup... Sabar ya!_`);

        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

        // --- PROSES WRAPPING ---
        const messageSecret = crypto.randomBytes(32);
        
        // Langsung bungkus tanpa prepare manual yang bikin error
        const msgContent = await generateWAMessageContent(content, {
            upload: conn.waUploadToServer
        });

        // Cek jika msgContent kosong (Gagal upload)
        if (Object.keys(msgContent).length === 0) throw "Gagal menyiapkan konten media.";

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
            { userJid: conn.user.id }
        );

        await conn.relayMessage(targetGc, message.message, {
            messageId: message.key.id,
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("SWGC Error:", e);
        m.reply(`❌ *Gagal:* ${e.message || e}`);
    }
};

handler.help = ["swgc"];
handler.tags = ["group"];
handler.command = /^(swgc|upswgc)$/i;
handler.group = true;

module.exports = handler;
