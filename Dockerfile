FROM node:20-alpine

WORKDIR /app

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm install typescript ts-node

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the server
CMD ["node", "dist/server.js"]
