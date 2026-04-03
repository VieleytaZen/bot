const crypto = require("crypto");

/**
 * --- INTERNAL BAILEYS LOADER (STABLE) ---
 * Fungsi ini otomatis mencari library Baileys yang terinstall 
 * baik itu @adiwajshing, @whiskeysockets, atau standar 'baileys'.
 */
let baileysData = null;
const loadBaileysInternal = async () => {
    if (!baileysData) {
        const modules = ["@whiskeysockets/baileys", "@adiwajshing/baileys", "baileys"];
        let lib;

        for (const mod of modules) {
            try {
                lib = require(mod);
                break;
            } catch (e) {
                continue;
            }
        }

        if (!lib) {
            throw "Modul Baileys tidak ditemukan! Jalankan 'npm install @whiskeysockets/baileys' di terminal.";
        }

        const root = lib.default || lib;
        baileysData = {
            generateWAMessageContent: root.generateWAMessageContent,
            generateWAMessageFromContent: root.generateWAMessageFromContent,
            proto: root.proto,
        };
    }
    return baileysData;
};

let handler = async (m, { conn, text, command, prefix, isOwner }) => {
    // 1. Validasi Grup
    if (!m.isGroup) throw "*Hmph!* Perintah ini cuma bisa dipakai di dalam GRUP! 😤";

    try {
        // Muat fungsi internal
        const { generateWAMessageContent, generateWAMessageFromContent } = await loadBaileysInternal();

        // 2. Tentukan sumber media (Quoted atau pesan asli)
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || "";
        let caption = text ? text.trim() : "";

        let content = {};
        let isMedia = /image|video|audio/.test(mime);

        // 3. Logika Penentuan Konten (Media vs Teks)
        if (isMedia) {
            const media = await q.download?.();
            if (!media) throw "Gagal mendownload media! Coba kirim ulang medianya.";

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

        await m.reply(`_Sssttt... Sedang mengirim Status Grup..._`);

        // 4. Penentuan Target Grup (Fitur Khusus Owner: idgc|caption)
        let targetGc = m.chat;
        if (isOwner && caption.includes("|")) {
            const [idgc, ...rest] = caption.split("|");
            targetGc = idgc.trim().endsWith("@g.us") ? idgc.trim() : `${idgc.trim()}@g.us`;
            const cleanText = rest.join("|").trim();
            if (content.caption !== undefined) content.caption = cleanText;
            if (content.text !== undefined) content.text = cleanText;
        }

        // 5. Konstruksi Group Status Message V2
        // Pastikan 'conn.waUploadToServer' tersedia di base bot kamu
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

        // 6. Eksekusi Pengiriman via RelayMessage
        await conn.relayMessage(targetGc, message.message, {
            messageId: message.key.id,
        });

        // Reaksi Sukses
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("Error SWGC:", e);
        m.reply(`❌ *Gagal:* ${e.message || e}`);
    }
};

handler.help = ["swgc", "upswgc"];
handler.tags = ["owner", "group"];
handler.command = /^(swgc|upswgc)$/i;
handler.admin = true;
handler.group = true;

module.exports = handler;
