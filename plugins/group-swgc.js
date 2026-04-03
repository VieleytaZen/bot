const crypto = require("crypto");

// --- INTERNAL BAILEYS LOADER (FORCED @ADIWAJSHING) ---
let baileysData = null;
const loadBaileysInternal = async () => {
    if (!baileysData) {
        try {
            // Memaksa memanggil folder @adiwajshing yang kamu miliki
            const baileys = require("@adiwajshing/baileys");
            
            // Mencoba mengambil dari export default atau langsung
            const root = baileys.default || baileys;
            
            if (!root.generateWAMessageContent) {
                // Jika masih gagal, kita coba akses sub-modulnya langsung
                baileysData = {
                    generateWAMessageContent: require("@adiwajshing/baileys/lib/Utils").generateWAMessageContent,
                    generateWAMessageFromContent: require("@adiwajshing/baileys/lib/Utils").generateWAMessageFromContent,
                    proto: root.proto || require("@adiwajshing/baileys/WAProto").proto
                };
            } else {
                baileysData = {
                    generateWAMessageContent: root.generateWAMessageContent,
                    generateWAMessageFromContent: root.generateWAMessageFromContent,
                    proto: root.proto,
                };
            }
        } catch (e) {
            console.error("Gagal total memuat @adiwajshing:", e);
            throw "Sistem tidak bisa menemukan folder '@adiwajshing/baileys'. Cek apakah folder itu ada di node_modules!";
        }
    }
    return baileysData;
};

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    try {
        const { generateWAMessageContent, generateWAMessageFromContent } = await loadBaileysInternal();

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

        await m.reply(`_Sedang memproses SWGC..._`);

        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

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
handler.admin = true;
handler.group = true;

module.exports = handler;
