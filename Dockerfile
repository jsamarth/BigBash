FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/*/package*.json ./packages/*/
COPY workflows/package*.json ./workflows/
COPY workers/package*.json ./workers/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build all packages
RUN npm run build

# Expose API port
EXPOSE 3000

# Default command (can be overridden)
CMD ["npm", "run", "dev:api"]


