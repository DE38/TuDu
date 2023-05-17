FROM node:20

# ----------------------------
LABEL maintainer = "Karl Mörtzschky <eiklautdaten@icloud.com>"
LABEL date="17.05.2023"
# ----------------------------

# wollen wir das prod lassen?
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /var/www/app
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE ${PORT}

ENTRYPOINT ["npm", "start"]

