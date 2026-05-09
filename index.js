const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const express = require('express')
const qrcode = require('qrcode')

global.botname = '𝗞𝗔𝗡𝗗𝗔𝗟𝗔 𝗧𝗘𝗖𝗛®'
global.ownername = 'Kandala'
global.ownernumber = process.env.OWNER_NUMBER || '255672752355'
global.prefix = '.'

const app = express()
const port = process.env.PORT || 3000

let sock, qr

app.get('/', (req, res) => {
    res.send(`
    <html>
    <head><title>${global.botname} Pair</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { background:#0f172a; color:#fff; font-family:sans-serif; text-align:center; padding:20px }
.box { background:#1e293b; padding:20px; border-radius:15px; max-width:400px; margin:auto }
        img { background:#fff; padding:10px; border-radius:10px; margin:10px }
        button { background:#22c55e; color:#000; border:none; padding:12px 25px; border-radius:8px; font-weight:bold; margin:5px; cursor:pointer }
     .status { color:#22c55e; font-weight:bold; font-size:18px }
    </style>
    </head>
    <body>
        <div class="box">
            <h2>${global.botname}</h2>
            <p>Owner: +${global.ownernumber}</p>
            <p>GitHub: github.com/kandala20/-KE</p>
            <hr>
            ${qr? `<h3>Scan QR Code</h3><img src="${qr}" width="250"><p>WhatsApp > Linked Devices > Link a device</p>` : '<h3 class="status">Bot is Online ✅</h3>'}
            <br><button onclick="location.reload()">Refresh QR</button>
            <p style="margin-top:20px">Deploy: Heroku | Render | Railway</p>
        </div>
    </body>
    </html>
    `)
})

app.listen(port, () => console.log(`Pair Site: http://localhost:${port}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        printQRInTerminal: false
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr: qrCode } = update

        if (qrCode) {
            qr = await qrcode.toDataURL(qrCode)
            console.log('QR Generated - Open http://localhost:3000')
        }

        if (connection === 'open') {
            qr = null
            console.log(`✅ ${global.botname} Online!`)
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        }
    })

    sock.plugins = {}
    const pluginDir = path.join(__dirname, 'plugins')
    if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir)
    fs.readdirSync(pluginDir).forEach(file => {
        if (file.endsWith('.js')) {
            const plugin = require(`./plugins/${file}`)
            sock.plugins[plugin.name] = plugin
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        if (!body.startsWith(global.prefix)) return
        const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
        const args = body.trim().split(' ').slice(1)
        const from = m.key.remoteJid
        const plugin = sock.plugins[cmd]
        if (plugin) {
            try { await plugin.execute(sock, m, args, from) }
            catch (e) { console.log(e) }
        }
    })
}

startBot()
