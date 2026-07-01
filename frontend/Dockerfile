FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache curl && npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
