FROM node:24

WORKDIR /app
COPY package*.json ./
RUN npm install

RUN npx playwright install chromium --with-deps
COPY . .

CMD ["node", "index.js"]
