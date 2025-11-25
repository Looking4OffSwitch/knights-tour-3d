# Coolify / VPS Deployment Guide

Deploy this project to a Coolify-managed VPS using the included Dockerfile. Coolify will build and run the container; the Express server serves the Vite SPA from `dist/public`.

## Quick steps (Coolify UI)
1. In Coolify, create an **Application** → **Dockerfile** project.
2. Repository: this repo; **Branch**: main (or your target).
3. **Build settings**
   - Dockerfile path: `Dockerfile`
   - Build args: none required (pnpm is enabled via Corepack)
4. **Environment**
   - `PORT=3000` (or any free port; Coolify will map it)
   - Optional: `NODE_ENV=production` (already set in the image)
5. **Networking**
   - Expose the container port you chose (default 3000) to a service port / domain.
6. **Deploy** – Coolify builds, runs `node dist/index.js`, and watches for git changes.

## What changed
- Added a multi-stage `Dockerfile` that installs dependencies with pnpm, runs `pnpm build`, prunes devDependencies, and starts the bundled Express server.
- Added `.dockerignore` to keep the build context small.
- No code changes were required; the server already uses `PORT` and serves SPA routes.
- Corepack is enabled in the Docker image so pnpm 10.x works out of the box.

## Build locally (optional)
```bash
docker build -t knights-tour-3d .
docker run --rm -p 3000:3000 knights-tour-3d
```
Then visit http://localhost:3000.

## Alternative: Coolify “Node.js” preset (no Dockerfile)
- Build command: `pnpm build`
- Start command: `pnpm start`
- Install command: `pnpm install --frozen-lockfile`
- Node version: 20.x
Use this only if you prefer Coolify’s buildpacks; the Dockerfile path is the recommended, reproducible approach.
