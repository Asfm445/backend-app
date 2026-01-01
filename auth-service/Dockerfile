FROM node:25-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

FROM base AS dependencies
COPY package*.json ./
RUN npm install --omit=dev

FROM base AS builder
COPY package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm install
COPY . .
RUN npm run build

FROM node:25-alpine 
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 4001
CMD ["node", "dist/api/index.js"]
