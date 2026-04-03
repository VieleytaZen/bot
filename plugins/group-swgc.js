const crypto = require("crypto");

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    try {
        // Ambil loader sesuai main.js kamu
        const { loadBaileys } = require("../baileys-loader.mjs");
        const baileys = await loadBaileys();
        const { generateWAMessageContent, generateWAMessageFromContent } = baileys.default || baileys;

        // Tentukan sumber media (apakah reply atau pesan itu sendiri)
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || "";
        let caption = text ? text.trim() : (q.msg?.caption || "");

        let content = {};
        
        // CEK APAKAH ADA MEDIA
        if (/image|video|audio/.test(mime)) {
            // DOWNLOAD MEDIA
            let media = await q.download?.();
            if (!media) throw "Gagal mendownload media! Pastikan medianya masih ada.";

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
            throw `*Cara Pakai:* \nReply foto/video dengan perintah *${prefix + command}*`;
        }

        await m.reply(`_Sssttt... Viel lagi up Status Grup..._`);

        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            if (content.caption !== undefined) content.caption = rest.join("|").trim();
            if (content.text !== undefined) content.text = rest.join("|").trim();
        }

        // BAGIAN KRUSIAL: Upload media ke server WhatsApp
        const messageSecret = crypto.randomBytes(32);
        
        // Kita pakai waUploadToServer dari conn
        const msgContent = await generateWAMessageContent(content, {
            upload: conn.waUploadToServer 
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
            { userJid: conn.user.id } // Tambahan agar server tahu siapa pengirimnya
        );

        await conn.relayMessage(targetGc, message.message, {
            messageId: message.key.id,
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        m.reply(`❌ *Gagal:* ${e.message || e}`);
    }
};

handler.help = ["swgc"];
handler.tags = ["group"];
handler.command = /^(swgc|upswgc)$/i;
handler.group = true;

module.exports = handler;
