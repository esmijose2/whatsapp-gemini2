
FROM node:18
RUN apt-get update && apt-get install -y chromium fonts-freefont-ttf libxss1 --no-install-recommends
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
