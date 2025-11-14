# Repository Guidelines

## Project Structure & Module Organization

The React front end lives in `client/src`, organized by feature: UI in `components/`, route-level views in `pages/`, shared hooks in `hooks/`, and helper logic in `lib/`. Static assets belong in `client/public`. The Express API and solver orchestration sit in `server/index.ts`, while cross-cutting constants go in `shared/const.ts`. Build artifacts land in `dist/`, and pnpm patch files are tracked under `patches/`.

## Build, Test, and Development Commands

Use pnpm for all workflows. `pnpm install` syncs dependencies. `pnpm dev` runs the Vite dev server on all interfaces for rapid UI iterations. `pnpm tsx server/index.ts` starts the API with live TypeScript transpilation; keep it in a parallel terminal during development. `pnpm build` emits the Vite client bundle and bundles the server via esbuild. `pnpm preview` serves the built client, while `pnpm start` runs the compiled server in production mode. `pnpm check` performs a no-emit TypeScript project sweep, and `pnpm format` applies the Prettier rules in `.prettierrc`.

## Coding Style & Naming Conventions

The codebase is TypeScript-first; prefer `*.tsx` for React components and `*.ts` elsewhere. Prettier enforces 2-space indentation, 80-character width, semicolons, and double quotes. Name hooks `useThing`, components `PascalCase`, utilities `camelCase`, and colocate styling next to the component it supports. Keep modules focused, exporting from `index.ts` barrels only when multiple siblings are reused together.

## Testing Guidelines

Vitest drives unit and integration coverage. Co-locate specs next to the subject file as `<name>.test.ts`/`.test.tsx`, or stage feature flow tests under `client/src/__tests__/`. Run suites with `pnpm vitest --run`; add `--coverage` before merging solver or API changes. Prioritize knight move generation, board heuristics, and REST handlers. Snapshots are acceptable for static UI fragments, but assert stateful logic explicitly.

## Commit & Pull Request Guidelines

History currently uses short imperative subjects (“Initial commit”). Continue that tone and optionally adopt Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) for clarity. Each PR should explain the “why,” summarize the major files touched, link related issues, and list the commands you ran (e.g., `pnpm build && pnpm vitest --run`). Attach before/after screenshots or clips for UI changes and call out schema or environment alterations.

## Security & Configuration Tips

Never commit secrets—`.env*` files are gitignored, so store API keys or service URLs there and document expected variables in your PR description. Shared values in `shared/const.ts` must be safe for both client and server contexts. When bumping dependencies, review anything under `patches/` so local fixes are re-applied.
