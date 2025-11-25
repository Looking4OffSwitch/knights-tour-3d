# syntax=docker/dockerfile:1.6

FROM node:20-slim AS base
# Enable pnpm via Corepack in every stage
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
WORKDIR /app
# Copy only files needed for dependency resolution first for better caching
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
# Build Vite client + bundle Express server
RUN pnpm build
# Strip devDependencies to keep runtime image small
RUN pnpm prune --prod

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.js"]
