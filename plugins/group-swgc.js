const crypto = require("crypto");

// --- JALUR KHUSUS LOADER RTXZY ---
let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    // 1. Validasi Grup
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    try {
        // 2. LOAD BAILEYS SECARA DINAMIS (Sesuai main.js kamu)
        const { loadBaileys } = require("../baileys-loader.mjs");
        const baileys = await loadBaileys();
        
        // Ambil fungsinya (antisipasi ESM/CJS)
        const genContent = baileys.generateWAMessageContent || baileys.default?.generateWAMessageContent;
        const genFromContent = baileys.generateWAMessageFromContent || baileys.default?.generateWAMessageFromContent;

        if (!genContent) throw "Gagal mengambil fungsi Baileys dari loader.";

        // 3. Tentukan Media
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || "";
        let caption = text ? text.trim() : "";

        let content = {};
        let isMedia = /image|video|audio/.test(mime);

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

        await m.reply(`_Sedang mengirim Status Grup... Sabar ya!_`);

        // 4. Target Grup
        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

        // 5. Eksekusi SWGC
        const messageSecret = crypto.randomBytes(32);
        const msgContent = await genContent(content, {
            upload: conn.waUploadToServer,
        });

        const message = genFromContent(
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
