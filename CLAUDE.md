# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 3D Knight's Tour visualizer built with React, TypeScript, and Vite. The application solves the classic knight's tour problem extended to 3D by stacking multiple chessboard layers, visualizing the solution with an interactive 3D isometric view.

## Development Commands

### Development

- `pnpm dev` - Start Vite dev server with HMR (runs on port 3000 or next available)
- `pnpm check` - Run TypeScript type checking without emitting files
- `pnpm format` - Format code with Prettier

### Testing

- `npx vitest` - Run tests in watch mode
- `npx vitest run` - Run tests once
- `npx vitest --ui` - Run tests with Vitest UI

### Build & Production

- `pnpm build` - Build both client (Vite) and server (esbuild)
  - Client output: `dist/public/`
  - Server output: `dist/index.js`
- `pnpm start` - Run production server (serves from `dist/public/`)
- `pnpm preview` - Preview production build locally

### Package Manager

- This project uses **pnpm** (lockfile: `pnpm-lock.yaml`)
- Has a patched dependency: `wouter@3.7.1` (see `patches/` directory)
- Has an override: `tailwindcss>nanoid` pinned to version 3.3.7

## Architecture

### Core Algorithm (`client/src/lib/knightsTour.ts`)

- Implements 3D knight's tour solver using backtracking with Warnsdorf's heuristic
- Moves are generated as all permutations of (±2, ±1, 0) across x, y, and z axes
- **5x5 boards are explicitly disabled** (returns unsolvable immediately)
- Configurable limits: `maxBacktracks` and `maxMs` to prevent infinite solving
- Key exports: `solveKnightsTour()`, `Position`, `TourResult`, `TourOptions`

### 3D Visualization (`client/src/components/ChessBoard3D.tsx`)

- Uses CSS 3D transforms to create isometric view (60° X-rotation, 45° Z-rotation)
- Renders layers from top to bottom with `preserve-3d` transform style
- Implements intelligent transparency for occluded squares when knight is on lower layers
- Knight piece rendered as 3D GLB model using `<model-viewer>` web component
- Dynamic fit-to-view scaling based on viewport dimensions
- Path lines drawn with SVG overlays connecting consecutive moves
- Gradient coloring for visited squares based on move order

### Path Aliases (configured in `vite.config.ts`)

- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### UI State Management (`client/src/pages/Home.tsx`)

- All state managed with React hooks (no external state library)
- Animation loop uses `requestAnimationFrame` for smooth playback
- User preferences persisted to `localStorage`: `gradientStart`, `gradientEnd`, `showNumbers`
- Currently hardcoded: 3 layers, 8x8 board size, start position (0,0,0)

### Styling

- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- shadcn/ui components (Radix UI primitives)
- CSS variables for theming (see `client/src/index.css`)

### Server (`server/index.ts`)

- Minimal Express server for production
- Serves static files from `dist/public/`
- Handles client-side routing (SPA fallback to `index.html`)
- No API endpoints - all computation happens client-side

## Deployment

- Configured for Vercel (see `vercel.json`)
- Static build output served from `dist/public/`
- Client-side routing configured with fallback routes

## Important Constraints

1. **Board Size Restriction**: 5x5 boards are not supported (see `knightsTour.ts:168-176`)
2. **No Backend API**: All solving happens in the browser
3. **Fixed Configuration**: Layers (3) and board size (8) are currently hardcoded in `Home.tsx`
4. **3D Movement**: Knight can move between layers using formal 3D knight moves (permutations of ±2, ±1, 0)

## Code Quality

- TypeScript with strict mode enabled
- ESLint configured (some rules disabled, e.g., `react-hooks/exhaustive-deps` for specific cases)
- Prettier for code formatting
- Don't commit or push to git unless I specifically tell you to.