FROM node:16

# Path to the app
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json and package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle the app source
COPY . .

EXPOSE 8080
# CMD ["node", "index.js"]
CMD ["npm", "run", "start", "--host", "0.0.0.0", "--port", "8080"]