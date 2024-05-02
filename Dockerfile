FROM node:latest

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "sh", "-c", "npx sequelize db:migrate && npm run dev" ]

