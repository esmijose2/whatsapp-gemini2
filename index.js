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
        res.send(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f0f2f5;font-family:sans-serif;">
            <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.1);text-align:center;">
                <h1 style="color:#075e54;">Escanea el QR</h1>
                <img src="${qrDataURL}" style="border:5px solid #25D366;border-radius:10px;">
                <p style="color:#667781;margin-top:15px;">Abre WhatsApp > Dispositivos vinculados</p>
            </div>
        </div>`);
    } else {
        res.send('<h1>Bot en línea ✅</h1><p>Si no responde, revisa los Logs en Back4App.</p>');
    }
});
app.listen(port, () => console.log('Servidor web en puerto ' + port));

// --- CONFIGURACIÓN GEMINI ---
const genAI = new GoogleGenerativeAI("AIzaSyApMi70tQpr3Pq7d8Lb4cxnYF7EmUdcHx4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const client = new Client({
    authStrategy: new LocalAuth(),
    // IMPORTANTE: Estos argumentos ayudan a que WhatsApp no bloquee la conexión en la nube
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
    }
});

// LOG PARA SABER SI EL QR SE GENERÓ
client.on('qr', async (qr) => {
    qrDataURL = await qrcodeImage.toDataURL(qr);
    console.log('--- NUEVO QR GENERADO ---');
});

// LOG PARA SABER SI LA SESIÓN SE INICIÓ
client.on('authenticated', () => console.log('¡Autenticado con éxito!'));
client.on('auth_failure', (msg) => console.error('Fallo en la autenticación:', msg));

client.on('ready', () => {
    qrDataURL = "";
    console.log('>>> EL BOT ESTÁ LISTO PARA RECIBIR MENSAJES <<<');
});

// --- DETECTOR DE MENSAJES (MODO DEBUG) ---
client.on('message_create', async (msg) => {
    // Esto imprimirá CUALQUIER mensaje que pase por tu WhatsApp en los logs
    console.log(`MENSAJE RECIBIDO DE [${msg.from}]: ${msg.body}`);

    if (msg.body.toLowerCase().startsWith('!bot ')) {
        console.log('¡Comando !bot detectado!');
        const prompt = msg.body.slice(5);
        
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            await msg.reply('@bot ' + response.text());
            console.log('Respuesta de Gemini enviada.');
        } catch (error) {
            console.error('Error con Gemini:', error);
            await msg.reply('@bot Error con la IA: ' + error.message);
        }
    }
});

client.initialize();
