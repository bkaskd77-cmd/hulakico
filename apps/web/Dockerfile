# syntax=docker/dockerfile:1
# Hulakico web image for the VPS. Build with deploy/docker-compose.yml.
# Only source folders are copied, so local .env files and data/ never enter the image.
# Base images are pinned by digest; Dependabot proposes updates.

FROM node:24.22.1-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY app ./app
COPY lib ./lib
COPY public ./public
COPY types ./types
COPY next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs instrumentation.ts ./
# Production values are mounted only for the build step and are not stored in a layer.
RUN --mount=type=secret,id=env,target=/app/.env.production npm run build

FROM node:24.22.1-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205
# The server runs `node server.js` only. Removing npm, npx, and corepack drops
# their bundled packages (and any advisories in them) from the production image.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Backup volume mount point, writable by the app user.
RUN mkdir -p /app/backups && chown node:node /app/backups
USER node
EXPOSE 3000
CMD ["node", "server.js"]
