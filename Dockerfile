FROM node:20.10.0

WORKDIR /user/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/server.js"]
