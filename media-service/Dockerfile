FROM node:18-slim

RUN apt-get update && apt-get install -y ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4001

CMD ["node", "src/app.js"]
