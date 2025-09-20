FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json ./
RUN npm ci || npm install

# Copy source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

