FROM node:16

# Path to the app
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json and package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle the app source
COPY . .

EXPOSE 3040
CMD ["node", "index.js"]