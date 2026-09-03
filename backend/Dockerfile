# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S vinylab && adduser -S vinylab -G vinylab \
  && mkdir -p /app/data \
  && chown -R vinylab:vinylab /app
COPY --from=build --chown=vinylab:vinylab /app/package.json ./package.json
COPY --from=build --chown=vinylab:vinylab /app/node_modules ./node_modules
COPY --from=build --chown=vinylab:vinylab /app/dist ./dist
USER vinylab
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
