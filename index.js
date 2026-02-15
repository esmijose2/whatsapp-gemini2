const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express'); // Añadido

// --- MINI SERVIDOR PARA BACK4APP ---
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Bot funcionando ✅'));
app.listen(port, () => console.log(`Servidor en puerto ${port}`));
// ----------------------------------

const genAI = new GoogleGenerativeAI("TU_API_KEY_AQUI");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('>>> ESCANEA ESTE QR EN TU WHATSAPP <<<');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => { console.log('¡Bot conectado y listo!'); });

client.on('message', async (msg) => {
    if (msg.body.startsWith('!bot ')) {
        const prompt = msg.body.replace('!bot ', '');
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            await msg.reply('@bot ' + response.text());
        } catch (error) {
            await msg.reply('@bot Error: ' + error.message);
        }
    }
});

client.initialize();
