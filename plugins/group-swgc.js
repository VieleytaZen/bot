const crypto = require("crypto");

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    try {
        const { loadBaileys } = require("../baileys-loader.mjs");
        const baileys = await loadBaileys();
        const { 
            generateWAMessageContent, 
            generateWAMessageFromContent, 
            prepareWAMessageMedia 
        } = baileys.default || baileys;

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || "";
        let caption = text ? text.trim() : (q.msg?.caption || "");

        let content = {};
        let isMedia = /image|video|audio/.test(mime);

        await m.reply(`_Sssttt... Viel lagi proses medianya, jangan berisik!_`);

        if (isMedia) {
            const media = await q.download?.();
            if (!media) throw "Gagal mendownload media!";

            // --- PERUBAHAN DISINI: Menggunakan prepareWAMessageMedia ---
            const mediaPrepared = await prepareWAMessageMedia(
                { [mime.split('/')[0]]: media }, 
                { upload: conn.waUploadToServer }
            );

            // Ambil hasil preparasi (imageMessage/videoMessage)
            const mediaType = mime.split('/')[0] + "Message";
            content = {
                [mediaType]: mediaPrepared[mediaType],
                caption: caption
            };
            
            // Khusus Audio
            if (/audio/.test(mime)) {
                content = { audio: media, mimetype: "audio/mpeg" };
            }
        } else if (caption) {
            content = { text: caption };
        } else {
            throw `*Cara Pakai:* \nReply foto/video dengan perintah *${prefix + command}*`;
        }

        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

        // --- KONSTRUKSI FINAL ---
        const messageSecret = crypto.randomBytes(32);
        
        // Bungkus konten menjadi Proto Message
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
            { userJid: conn.user.id }
        );

        // Kirim
        await conn.relayMessage(targetGc, message.message, {
            messageId: message.key.id,
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("SWGC ERROR:", e);
        m.reply(`❌ *Gagal:* ${e.message || e}`);
    }
};

handler.help = ["swgc"];
handler.tags = ["group"];
handler.command = /^(swgc|upswgc)$/i;
handler.group = true;

module.exports = handler;
