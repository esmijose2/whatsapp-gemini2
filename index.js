const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcodeImage = require('qrcode');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;
let qrDataURL = "";

app.get('/', (req, res) => {
    if (qrDataURL) {
        res.send(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h1>Escanea el QR</h1><img src="${qrDataURL}" style="border:10px solid #25D366;"></div>`);
    } else {
        res.send('<h1>Bot Conectado ✅</h1><p>Ya puedes cerrar esta pestaña y probar en WhatsApp.</p>');
    }
});
app.listen(port);

// --- PEGA TU API KEY AQUÍ ---
const genAI = new GoogleGenerativeAI("AIzaSyApMi70tQpr3Pq7d8Lb4cxnYF7EmUdcHx4");
const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    qrDataURL = await qrcodeImage.toDataURL(qr);
    console.log('NUEVO QR GENERADO - Míralo en el link de Back4App');
});

client.on('ready', () => {
    qrDataURL = "";
    console.log('¡SÍ! El bot está listo y esperando mensajes.');
});

// USAMOS 'message_create' para que funcione incluso si escribes en tu propio chat
client.on('message_create', async (msg) => {
    // 1. Verificamos si el mensaje empieza con !bot
    if (msg.body.startsWith('!bot ')) {
        console.log('Mensaje detectado: ' + msg.body);
        
        const prompt = msg.body.replace('!bot ', '');
        
        try {
            // 2. Llamada a Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // 3. Responder
            await msg.reply('@bot ' + text);
            console.log('Respuesta enviada con éxito');
        } catch (error) {
            console.error('Error al hablar con Gemini:', error);
            await msg.reply('@bot Hubo un error con mi cerebro de IA.');
        }
    }
});

client.initialize();
