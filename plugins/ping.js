module.exports = {
    name: 'ping',
    async execute(sock, m, args, from) {
        const start = Date.now()
        await sock.sendMessage(from, { text: 'Testing...' })
        const end = Date.now()
        await sock.sendMessage(from, { text: `*Pong!* ${end - start}ms\n*Bot:* ${global.botname}` })
    }
}
