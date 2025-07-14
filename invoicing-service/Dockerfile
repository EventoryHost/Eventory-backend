FROM node:24

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npx playwright install --with-deps

CMD ["node", "index.js"]