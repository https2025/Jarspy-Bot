let jarspy = async (m, { conn }) => { 
let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender 
 conn.sendFile(m.chat, global.API('https://some-random-api.com', '/canvas/horny', { 
 avatar: await conn.profilePictureUrl(who, 'image').catch(_ => 'https://telegra.ph/file/24fa902ead26340f3df2c.png'), 
 }), 'hornycard.png', 'Selesai', m) 
} 
jarspy.help = ['hornycard', 'hornylicense'] 
jarspy.tags = ['maker']  
jarspy.command = /^(horny(card|license))$/i  
export default jarspy