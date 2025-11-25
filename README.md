# Knight's Tour 3D

An interactive 3D visualization of the knight's tour problem extended to multiple stacked chessboard layers. Watch as a chess knight attempts to visit every square exactly once across 3D space using mathematically valid knight moves.

## Features

- **3D Isometric Visualization** - Stacked chessboard layers with CSS 3D transforms
- **Interactive Controls** - Adjust zoom, spacing, colors, and animation speed
- **Customizable Tour Colors** - Real-time gradient editing with preview
- **Manual Step-Through** - Step backward/forward through the tour at your own pace
- **Keyboard Shortcuts** - Full keyboard control for seamless interaction
- **Knight Visibility System** - Optional transparency for occluded squares
- **Responsive Design** - Adaptive layout with collapsible control panel
- **Backtracking Algorithm** - Solves knight's tour using Warnsdorf's heuristic

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **3D Rendering**: CSS 3D transforms
- **Backend**: Express (production server)
- **Package Manager**: pnpm 10.x

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000` (or next available port).

## Development

### Available Scripts

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm check        # Run TypeScript type checking
pnpm format       # Format code with Prettier
```

### Version Management

This project uses [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

**Before committing changes that should be released:**

```bash
# For bug fixes (1.0.0 → 1.0.1)
pnpm version:patch

# For new features (1.0.0 → 1.1.0)
pnpm version:minor

# For breaking changes (1.0.0 → 2.0.0)
pnpm version:major
```

These commands will:
1. Update the version in `package.json`
2. Create a git commit with the version bump
3. Create a git tag for the release
4. Display the new version in the UI (bottom of Controls panel)

**Important:** Always bump the version **before** committing feature/fix changes, not after.

### Recommended Workflow

```bash
# 1. Make your changes
git add .

# 2. Bump version (choose appropriate level)
pnpm version:patch  # or minor/major

# 3. Commit your feature/fix changes
git commit -m "Add new feature X"

# 4. Push changes and tags
git push && git push --tags
```

## Project Structure

```
knights-tour-3d/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities (knight's tour algorithm)
│   │   └── pages/       # Page components
│   └── public/          # Static assets
├── server/              # Express backend
├── shared/              # Shared types/constants
└── docs/                # Documentation
```

## Algorithm

The knight's tour solver uses:
- **Backtracking** with Warnsdorf's heuristic
- **3D move generation** (±2, ±1, 0 permutations across x, y, z)
- **Configurable limits** (max backtracks, timeout)
- **Board size restrictions** (5×5 boards explicitly unsupported)

## Deployment

- Coolify / VPS (containerized): [DEPLOYMENT-COOLIFY.md](./DEPLOYMENT-COOLIFY.md)

## License

MIT
