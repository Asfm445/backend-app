# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Optional: if you have public/static files, copy them here
# COPY --from=builder /app/public ./public

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/src/api/index.js"]
