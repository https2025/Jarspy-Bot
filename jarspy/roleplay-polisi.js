import db from '../lib/database/index.js';

const STATES = {
    IDLE: 0,
    SEARCHING: 1,
    FIGHTING: 2,
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const jarspy = async (m, {
    conn,
    usedPrefix,
    command,
    args
}) => {
    const sender = m.sender;
    const user = await db.users.get(m.sender);
    conn.players = conn.players || {};
    const player = conn.players[sender] || {
        Uang: 0,
        Pencuri_Tertangkap: 0,
        Waktu_Tertangkap: 0,
        Kaca_Pembesar: 0,
        Level: 1,
        State: STATES.IDLE
    };

    if (command === "polisi") {
        if (args.length === 0) {
            conn.reply(m.chat, "*👮‍♂️ Cara Bermain Game Polisi dan Pencuri 👮‍♂️*\n\n" +
                "🔍 Gunakan perintah *polisi cari* untuk mencari pencuri secara acak.\n" +
                "🚓 Anda akan menemukan jejak pencuri dan harus melakukan tindakan tertentu untuk menangkapnya.\n" +
                "💰 Anda akan mendapatkan imbalan jika berhasil menangkap pencuri.\n" +
                "🚨 Pilih tindakan dari: kejar, tembak, lempar, atau tangkap.\n" +
                "🔍 Gunakan perintah *polisi <tindakan>* untuk melawan dan menangkap pencuri.\n" +
                "🔎 Anda dapat membeli kaca pembesar *polisi item kaca-pembesar* untuk meningkatkan peluang menangkap pencuri.\n" +
                "🏆 Cek peringkat Anda dengan perintah *polisi leaderboard*.\n" +
                "ℹ️ Gunakan perintah *polisi status* untuk melihat status Anda saat ini.\n\n" +
                "⚠️ NOTE: Perlu diingat, bahwa leaderboard & status polisi ini hanya bersifat sementara dan akan hilang di saat bot restart. Hadiah seperti imbalan Rp.10,000 tidak akan hilang.", m);
            return;
        }

        const subCommand = args[0];
        if (subCommand === "cari") {
            if (player.State !== STATES.IDLE) {
                return conn.reply(m.chat, "*🔍 Sedang dalam pencarian...*", m);
            }

            if (Date.now() - player.Waktu_Tertangkap < 60000) {
                return conn.reply(m.chat, "*⏱️ Kamu harus menunggu sebentar sebelum dapat mencari kembali.*", m);
            }

            player.State = STATES.SEARCHING;
            player.Waktu_Tertangkap = Date.now();

            const level = player.Level;
            const thiefActions = {
                1: "kejar",
                2: "tembak",
                3: "lempar",
                4: "tangkap",
            };
            const thiefAction = thiefActions[level];

            conn.reply(m.chat, `*🔍 Kamu menemukan jejak pencuri level ${level}!* Untuk menangkap pencuri, lakukan tindakan: */POLISI ${thiefAction.toUpperCase()}*.`, m);

            player.ThiefAction = thiefAction;
        } else if (subCommand === "status") {
            conn.reply(m.chat, `*👮‍♂️ Status Polisi 👮‍♂️*\n\n🔍 Sedang Mencari Pencuri: ${player.State === STATES.SEARCHING ? "Ya" : "Tidak"}\n🚓 Pencuri Tertangkap: ${player.Pencuri_Tertangkap}\n💰 Uang: Rp${player.Uang.toLocaleString()}\n🏆 Level Pencuri: ${player.Level}`, m);
        } else if (subCommand === "item") {
            if (args.length === 1) {
                conn.reply(m.chat, "*🛒 Item Shop 🛒*\n\nKaca Pembesar - 200 coins\n" +
                    `Gunakan *${usedPrefix}polisi item kaca-pembesar* untuk membeli kaca pembesar.`, m);
            } else {
                const item = args[1]?.toLowerCase();
                if (item === "kaca-pembesar") {
                    if (player.Kaca_Pembesar) {
                        return conn.reply(m.chat, "*🛒 Kamu sudah memiliki kaca pembesar.*", m);
                    }

                    if (player.Uang < 200) {
                        return conn.reply(m.chat, "*🛒 Uang kamu tidak cukup untuk membeli kaca pembesar.*", m);
                    }

                    player.Kaca_Pembesar = 1;
                    player.Uang -= 200;
                    conn.reply(m.chat, "*🛒 Kamu berhasil membeli kaca pembesar.* Gunakan 'polisi cari' untuk meningkatkan peluang menangkap pencuri.", m);
                } else {
                    conn.reply(m.chat, "*🛒 Item yang dimaksud tidak ditemukan.*", m);
                }
            }
        } else if (subCommand === "leaderboard") {
            // Sort players based on the number of thieves caught (descending order)
            const leaderboard = Object.entries(conn.players)
                .map(([playerId, playerData]) => ({
                    id: playerId,
                    Pencuri_Tertangkap: playerData.Pencuri_Tertangkap
                }))
                .sort((a, b) => b.Pencuri_Tertangkap - a.Pencuri_Tertangkap)
                .slice(0, 5); // Show top 5 players

            let leaderboardMsg = "*🏆 Leaderboard 🏆*\n\n";
            for (let i = 0; i < leaderboard.length; i++) {
                leaderboardMsg += `${i + 1}. @${leaderboard[i].id.split("@")[0]} - ${leaderboard[i].Pencuri_Tertangkap} Pencuri Tertangkap\n`;
            }

            conn.reply(m.chat, leaderboardMsg, m);
        } else if (subCommand === "stop") {
            db.users.update(m.sender, (user) => {
                user.money += player.Uang * player.Pencuri_Tertangkap;
            });
            let skorMsg = `*🏆 Skor Akhir Anda 🏆*\n\n🚓 Pencuri Tertangkap: ${player.Pencuri_Tertangkap}\n💰 Total Uang: Rp${player.Uang.toLocaleString()}\n🏆 Level Pencuri: ${player.Level}`;

            conn.reply(m.chat, `*👮‍♂️ Sesi permainan Polisi dan Pencuri telah dihentikan.*\n\n${skorMsg}`, m);
            player.State = STATES.IDLE;
            player.ThiefAction = undefined;
        } else {
            if (player.State !== STATES.SEARCHING) {
                return conn.reply(m.chat, "*🔍 Kamu harus mencari pencuri terlebih dahulu dengan perintah 'polisi cari'.*", m);
            }

            const polisiAction = subCommand.toLowerCase();
            const level = player.Level;
            const thiefActions = {
                1: ["kejar", "tembak", "lempar"],
                2: ["tembak", "tangkap"],
                3: ["tangkap"],
            };

            if (!thiefActions[level].includes(polisiAction)) {
                return conn.reply(m.chat, `*🚓 Pilihan tindakanmu (${polisiAction.toUpperCase()}) tidak sesuai dengan hasil yang dicari.*`, m);
            }

            if (thiefActions[level].includes(player.ThiefAction)) {
                let reward = 0;
                switch (polisiAction) {
                    case "kejar":
                        reward = 10000 * level;
                        break;
                    case "tembak":
                        reward = 20000 * level;
                        break;
                    case "lempar":
                        reward = 30000 * level;
                        break;
                    case "tangkap":
                        reward = 50000 * level;
                        break;
                }

                player.Pencuri_Tertangkap++;
                player.Uang += reward;
                await db.users.update(m.sender, (user) => {
                    user.money += reward;
                    user.exp += 9999
                });
                if (player.Uang < 5000) {
                    player.Uang = 5000;
                }

                conn.reply(m.chat, `*🚓 Anda berhasil melawan dan menangkap pencuri level ${level}!* Kamu mendapatkan imbalan Rp${reward.toLocaleString()} dan 9999 Exp. Total Uang: Rp${player.Uang.toLocaleString()}.`, m);
            } else {
                conn.reply(m.chat, "*🚓 Tindakanmu tidak tepat dan pencuri berhasil lepas!*", m);
            }

            player.State = STATES.IDLE;
            player.ThiefAction = undefined;
        }

        conn.players[sender] = player;
    } else if (command === "info") {
        conn.reply(m.chat, "*ℹ️ Gunakan perintah 'polisi' untuk memulai game Polisi dan Pencuri.*", m);
    }
};

jarspy.help = ["polisi"];
jarspy.tags = ["roleplay"];
jarspy.command = ["polisi"];

export default jarspy;