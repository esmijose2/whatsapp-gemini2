FROM node:18-slim

# Instalamos las dependencias necesarias para el navegador
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libxss1 \
    libasound2 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Saltamos la descarga automática de Chromium de Puppeteer (usaremos el del sistema)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiamos archivos y configuramos npm para que no de avisos molestos
COPY package*.json ./
RUN npm install --no-update-notifier

COPY . .

# Comando para iniciar
CMD ["node", "index.js"]
