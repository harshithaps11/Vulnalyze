FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

RUN npm install

# Copy rest of the source
COPY . .

EXPOSE 5173

# Run dev server bound to all interfaces so Docker can expose it
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
