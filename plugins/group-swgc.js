const crypto = require("crypto");

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma untuk di dalam GRUP! 😤";

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || "";
    let caption = text ? text.trim() : (q.msg?.caption || "");

    try {
        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            caption = rest.join("|").trim();
        }

        await m.reply(`_Viel lagi coba jalur paksa... Mohon doa restunya!_`);

        let message;
        const messageSecret = crypto.randomBytes(32);

        if (/image|video/.test(mime)) {
            // Jalur Media: Kita buat pesan media biasa dulu, lalu kita bungkus ke Status V2
            let media = await q.download();
            if (!media) throw "Gagal download media!";

            // Kita gunakan sendMessage tapi kita 'tahan' agar tidak terkirim dulu
            let rawMedia = await conn.prepareMessage(targetGc, media, /image/.test(mime) ? 'imageMessage' : 'videoMessage', { 
                caption,
                upload: conn.waUploadToServer 
            });

            message = {
                messageContextInfo: { messageSecret },
                groupStatusMessageV2: {
                    message: {
                        ...rawMedia,
                        messageContextInfo: { messageSecret },
                    },
                },
            };
        } else {
            // Jalur Teks
            message = {
                messageContextInfo: { messageSecret },
                groupStatusMessageV2: {
                    message: {
                        conversation: caption,
                        messageContextInfo: { messageSecret },
                    },
                },
            };
        }

        // KIRIM VIA RELAY
        await conn.relayMessage(targetGc, message, {
            messageId: conn.generateMessageID(),
            additionalAttributes: {
                category: "peer",
            }
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("SWGC CRITICAL ERROR:", e);
        // Fallback terakhir: Kirim teks saja kalau media benar-benar ditolak
        try {
            const messageSecret = crypto.randomBytes(32);
            await conn.relayMessage(m.chat, {
                groupStatusMessageV2: {
                    message: { conversation: text || "Gagal memuat media, hanya teks yang terkirim." }
                }
            }, {});
        } catch (err) {
            m.reply(`❌ *Gagal Total:* ${e.message || e}`);
        }
    }
};

handler.help = ["swgc"];
handler.tags = ["group"];
handler.command = /^(swgc|upswgc)$/i;
handler.group = true;

module.exports = handler;
