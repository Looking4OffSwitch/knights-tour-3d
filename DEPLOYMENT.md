# Vercel Deployment Guide

This project is configured for Vercel static hosting via `vercel.json`. The build consists of a Vite SPA located in `client/` that emits assets into `dist/public`, and these files are uploaded as your deployment output.

## 1. Prerequisites

- Install pnpm (v10+) locally; Vercel will use Corepack to install the correct version.
- Authenticate with the Vercel CLI: `pnpm dlx vercel login`.
- The project uses pnpm 10.4.1 as specified in `package.json`.

## 2. Required Environment Variables

This project requires **Corepack** to be enabled in Vercel to use pnpm 10.x.

In your Vercel Project Settings (`Settings → Environment Variables`), add:

| Key                            | Value | Description                                         |
| ------------------------------ | ----- | --------------------------------------------------- |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1`   | Enables Corepack to use pnpm 10.x from package.json |

Apply this to all environments (Production, Preview, Development).

## 3. Local Verification

Before pushing to Vercel:

```bash
pnpm install
pnpm build        # runs Vite build + server bundle
pnpm preview      # smoke-test the built client
```

## 4. Installing pnpm

| Platform | Command                                             | Notes                                                                     |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Windows  | `iwr https://get.pnpm.io/install.ps1 -useb \| iex`  | Run in PowerShell; re-open the terminal so the pnpm shim loads.           |
| macOS    | `curl -fsSL https://get.pnpm.io/install.sh \| sh -` | Works with zsh/bash; restart the shell to update `PATH`.                  |
| Linux    | `curl -fsSL https://get.pnpm.io/install.sh \| sh -` | Compatible with major distros; ensure `~/.local/share/pnpm` is on `PATH`. |

Verify with `pnpm -v`. Pin to the repo's expected major version (10+) to avoid lockfile churn.

## 5. Deploying via GitHub Integration

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `Looking4OffSwitch/knights-tour-3d`
3. **Before deploying**, add the environment variable:
   - Go to **Settings** → **Environment Variables**
   - Add `ENABLE_EXPERIMENTAL_COREPACK` = `1`
4. Trigger a deployment

The `routes` rule in `vercel.json` ensures SPA-style client routing by rewriting unmatched paths to `index.html`.

## 6. Deploying via Vercel CLI (Optional)

1. Run `pnpm dlx vercel link` once to associate the repo with a Vercel project.
2. Ensure `ENABLE_EXPERIMENTAL_COREPACK=1` is set in your project settings.
3. Deploy previews per branch with `pnpm dlx vercel`
4. Promote to production via `pnpm dlx vercel --prod`

## Troubleshooting

### "ERR_PNPM_LOCKFILE_CONFIG_MISMATCH"

This error occurs when Vercel uses pnpm 9.x but the lockfile was created with pnpm 10.x.

**Solution**: Ensure `ENABLE_EXPERIMENTAL_COREPACK=1` is set in Vercel's environment variables.

### Patched Dependencies

The project uses a patched version of `wouter@3.7.1`. Corepack with pnpm 10.x is required to properly install this patch during deployment.
