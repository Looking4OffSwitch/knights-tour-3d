# Vercel Deployment Guide

This project is configured for Vercel static hosting via `vercel.json`. The build consists of a Vite SPA located in `client/` that emits assets into `dist/public`, and these files are uploaded as your deployment output.

## 1. Prerequisites

- Install pnpm (v10+) locally; Vercel will run `pnpm install --frozen-lockfile`.
- Authenticate with the Vercel CLI: `pnpm dlx vercel login`.
- Ensure the required environment variables are available before building.

## 2. Required Environment Variables

Set these in your Vercel Project Settings (`Settings → Environment Variables`). Use the same values for `Production`, `Preview`, and `Development` unless you intentionally differ:

| Key                           | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_APP_TITLE`              | UI title string. Optional, defaults to `App`.                                            |
| `VITE_APP_ID`                 | OAuth application/client identifier for login redirects.                                 |
| `VITE_OAUTH_PORTAL_URL`       | Base URL to the OAuth portal (e.g., `https://accounts.example.com`).                     |
| `VITE_FRONTEND_FORGE_API_KEY` | Google Maps proxy API key issued by Forge.                                               |
| `VITE_FRONTEND_FORGE_API_URL` | Optional base URL for the Forge proxy; defaults to `https://forge.butterfly-effect.dev`. |

Changes to these vars require a redeploy.

## 3. Local Verification

Before pushing to Vercel:

```bash
pnpm install
pnpm build        # runs Vite build + server bundle
pnpm preview      # smoke-test the built client
pnpm exec vercel build  # optional, mirrors Vercel’s CI build
```

## 4. Installing pnpm

| Platform | Command                                             | Notes                                                                     |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Windows  | `iwr https://get.pnpm.io/install.ps1 -useb          | iex`                                                                      | Run in PowerShell; re-open the terminal so the pnpm shim loads. |
| macOS    | `curl -fsSL https://get.pnpm.io/install.sh \| sh -` | Works with zsh/bash; restart the shell to update `PATH`.                  |
| Linux    | `curl -fsSL https://get.pnpm.io/install.sh \| sh -` | Compatible with major distros; ensure `~/.local/share/pnpm` is on `PATH`. |

Verify with `pnpm -v`. Pin to the repo’s expected major version (10+) to avoid lockfile churn.

## 4. Deploying

1. Run `pnpm exec vercel link` once to associate the repo with a Vercel project.
2. Deploy previews per branch with `pnpm exec vercel --prebuilt` (uses local `pnpm build` output) or `pnpm exec vercel` to let Vercel build.
3. Promote to production via `pnpm exec vercel --prod`.

The `routes` rule in `vercel.json` ensures SPA-style client routing by rewriting unmatched paths to `index.html`.
