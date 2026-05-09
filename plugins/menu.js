module.exports = {
    name: 'menu',
    async execute(sock, m, args, from) {
        const text = `╭═══〘 ${global.botname} 〙═══⊷
┃❍ *Owner:* +${global.ownernumber}
┃❍ *Deploy:* Heroku/Render/Railway
┃❍ *Repo:* github.com/kandala20/-KE
╰══════════════════⊷

.menu - Menu
.ping - Speed`
        await sock.sendMessage(from, { text })
    }
}
