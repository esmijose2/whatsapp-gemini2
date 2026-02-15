const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcodeImage = require('qrcode'); // Nueva pieza para la web
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;
let qrDataURL = ""; // Aquí guardaremos el código para verlo en la web

// --- PÁGINA PARA VER EL QR ---
app.get('/', (req, res) => {
    if (qrDataURL) {
        res.send(`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                <h1>Escanea este código con WhatsApp</h1>
                <img src="${qrDataURL}" style="border: 20px solid white; box-shadow: 0 0 20px rgba(0,0,0,0.2);">
                <p>Actualiza esta página si el código expira.</p>
            </div>
        `);
    } else {
        res.send('<h1>El bot se está iniciando o ya está conectado.</h1><p>Si no ves el QR, espera 30 segundos y recarga.</p>');
    }
});
app.listen(port, () => console.log('Servidor listo en puerto ' + port));

// --- GEMINI ---
const genAI = new GoogleGenerativeAI("AIzaSyApMi70tQpr3Pq7d8Lb4cxnYF7EmUdcHx4");
const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });

// --- WHATSAPP ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    // Esto lo sigue imprimiendo en consola por si acaso
    qrcodeTerminal.generate(qr, {small: true});
    // Esto crea la imagen para la página web
    qrDataURL = await qrcodeImage.toDataURL(qr);
});

client.on('ready', () => {
    qrDataURL = ""; // Borramos el QR cuando ya se conectó
    console.log('¡Bot conectado y listo!');
});

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
