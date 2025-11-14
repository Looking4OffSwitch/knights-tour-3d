# Knight’s Tour 3D — Product Requirements Document (PRD)

Version: 1.0

Date: November 14, 2025

## 1) Summary

Knight’s Tour 3D is a browser‑based visualizer that computes and animates a
knight’s tour across stacked chessboards. It renders multiple 8×8 layers in an
isometric 3D scene, solves a tour with backtracking using Warnsdorf’s
heuristic, and provides user controls to play, pause, step, reset, and fit the
view. Preferences for the visited‑square gradient and numeric overlays persist
locally.

## 2) Goals

- Make the knight’s tour intuitive in 3D by stacking layers and animating the
  path.
- Present a crisp, legible visualization that adapts to common viewport sizes.
- Provide focused controls for pace, visibility, and framing.

## 3) Non‑Goals

- No general solver workbench (no UI for arbitrary board sizes or layer
  counts).
- No server‑side solving or persistence (solver runs in the browser).
- No accounts, authentication, sharing, or export.

## 4) Users & Use Cases

- Educators/students: demonstrate graph traversal and heuristics.
- Puzzle enthusiasts: observe and step through a 3D knight’s tour.
- Engineers/designers: demo‑ready visualization for presentations.

## 5) Scope

- Single‑page web app (SPA):
  - “/” — Home (visualizer)
  - Unknown routes — 404 page with a “Go Home” action
- Production server serves static assets and routes all GET requests to the SPA.

## 6) Glossary & Data Shapes

- Square: board cell identified by `x` (file), `y` (rank), and `layer` (z).
- Position: `{ x: number; y: number; layer: number }`.
- Tour: an ordered list of positions that visits each square exactly once.
- Total squares: `layers * boardSize * boardSize`.
- TourResult:
  - `solution: Position[]`
  - `backtracks: number`
  - `elapsedMs: number`
  - `hitLimit: boolean`
  - `reason?: string`

## 7) Product Configuration (Fixed Defaults)

- Board size: `8` (N = 8)
- Layers: `3` (L = 3)
- Start position: `{ x: 0, y: 0, layer: 0 }`
- Animation speed range: `1–10` steps/second (default `1x`)
- Solver limits: `maxBacktracks = 1,000,000`, `maxMs = 5,000`
- Visited gradient defaults: start `#000000`, end `#FFFFFF`
- Show move numbers default: `true`
- Knight model path: `/models/knight.glb`

## 8) Functional Requirements

### 8.1 3D Board Visualization

- Render L stacked boards (top to bottom) in an isometric scene:
  - Transform: `rotateX ≈ 60°`, `rotateZ ≈ 45°`, `transform-style: preserve-3d`.
  - Layers are translated along Z to create separation; vertical spacing is
    sufficient to keep edges distinct.
- Squares:
  - Unvisited squares use a checkerboard background (alternating tones).
  - Visited squares are filled by interpolating between gradient start/end
    colors as a function of step index (1 → total squares).
  - Overlaid move numbers are 1‑based and displayed only when “Show Numbers” is
    enabled.
  - For visited squares, choose text color automatically (black/white) to
    ensure legibility.
- Knight:
  - Display a 3D GLB model at the current position; pointer events disabled.
  - Provide a graceful `<noscript>` fallback glyph (♞) when scripting is
    disabled.
- Path lines:
  - Draw thin (≈2px) semi‑transparent lines connecting centers of consecutive
    path positions (including cross‑layer segments).
- Occlusion handling:
  - Fade upper‑layer squares that would visually occlude the knight on lower
    layers, so the piece remains visible.
- Legend:
  - A compact gradient bar labeled `1` (start) and `total squares` (end),
    anchored near the top‑left of the scene container.
- Fit‑to‑view:
  - Scale and translate the scene so all layers fit within the viewport with
    small padding; recompute on resize.

Acceptance criteria:

- Top layer aligns just beneath the header and remains aligned across resizes.
- “Fit to view” reveals the entire stack without clipping on common screens
  (e.g., 1280×800, 1440×900) with subtle transitions.
- Path lines connect the correct squares across layers.
- Knight model loads from `/models/knight.glb`; fallback glyph appears when
  scripting is disabled.

### 8.2 Animation & Controls

- Primary controls:
  - Play/Resume: starts or continues stepping through the computed tour.
  - Pause: halts automatic stepping without clearing state.
  - Step Forward/Back: adjust current step by ±1 within bounds.
  - Reset: stops animation and clears solution and stats.
- Speed slider: integer `1–10` steps/sec, applied immediately.
- Show Numbers switch: toggles move index overlays on visited squares.
- Fit to view: recalculates scene scale/position; disabled while playing (unless
  paused).

Control states:

- Step Back disabled at first step; Step Forward disabled at last step.
- Fit to view disabled while playing and not paused.
- Reset disabled when there is nothing to reset.

### 8.3 Solving the Tour

- Move generation:
  - Use all unique permutations of `(±2, ±1, 0)` across `(dx, dy, dz)`; filter
    out‑of‑bounds and already‑visited positions.
- Heuristic:
  - Apply Warnsdorf’s rule: prioritize moves with the fewest onward options.
- Backtracking:
  - Depth‑first search; count backtracks on retreat; return the first complete
    tour found.
- Limits:
  - Abort early when exceeding `maxBacktracks` or `maxMs`; return
    `hitLimit = true` and `solution = []`.
- Edge cases:
  - `boardSize = 5` is unsupported; return `solution = []` and a reason.
  - Invalid start positions return `solution = []` and a reason.

Result handling:

- If solved:
  - Return a `solution` of length `L * N * N` (here `3 * 8 * 8 = 192`).
  - Display computation time (ms), total moves, and backtracks in the header.
  - Initialize `currentStep = 0` and allow animation/stepping.
- If not solved:
  - Alert one of:
    - `No solution: <reason>` when available (e.g., `Hit configured limits`).
    - `Stopped early due to configured limits; try a different start.`
    - `No solution found for this configuration!`

### 8.4 Status & Telemetry (UI)

- Header shows:
  - Progress: `visited count / total` and percentage.
  - Status: `Ready`, `Running`, or `Paused`.
  - Layers: static label `3`.
- When a solution exists:
  - Show computation time (ms), total moves, and backtracks.

Acceptance criteria:

- Progress increments with the current step; status reflects actual state.
- Performance stats appear only after a successful solve and persist until reset.

### 8.5 Tooltips & Color Gradient

- Visited squares show a tooltip on hover containing:
  - `Move N` (1‑based)
  - A color swatch matching the square’s fill
  - The hex value of the computed color
- Interpolate colors from gradient start to end based on `(index / (total - 1))`.
- Compute black/white text color for overlays to meet contrast targets.

### 8.6 Preferences & Persistence

- localStorage keys and defaults:
  - `showNumbers: "true" | "false"` (default `true`)
  - `gradientStart: "#RRGGBB"` (default `#000000`)
  - `gradientEnd: "#RRGGBB"` (default `#FFFFFF`)
- Invalid color inputs must not crash the app; last valid value prevails.

### 8.7 Routing & Error Boundary

- Routes:
  - `/` → visualizer (home)
  - Fallback route renders a friendly 404 with a “Go Home” button to `/`.
- Global error boundary:
  - Renders a crash UI with a short stack snippet and a “Reload Page” action.

### 8.8 Server & Deployment

- Production Node/Express server:
  - Serve compiled client assets from `dist/public`.
  - Route all unknown GETs to `index.html` to support SPA routing.
- Development uses a Vite dev server with HMR.

Acceptance criteria:

- Server logs a startup URL and serves `/models/knight.glb` with a correct
  content type.

## 9) User Flows

### 9.1 First‑Run

1. Load app → header + empty 3D board appear; the knight marker is shown at the
   starting square.
2. Legend shows `1` → `total squares` gradient scale; numbers are initially
   shown on visited squares once any appear.

### 9.2 Compute & Animate

1. Click Play → solver runs synchronously (≤ 5s or until limits).
2. If solved, header stats appear; `currentStep` is set to `0` and animation
   begins at the selected speed.
3. Scene updates as the current position advances; path lines and fills update.

### 9.3 Pause/Resume

1. Click Pause → animation halts.
2. Click again → resume from the same step.

### 9.4 Step & Inspect

1. Use Step Back/Forward to manually move through the path.
2. Hover over visited squares to see move number, color swatch, and hex value.

### 9.5 Reset

1. Click Reset → clear solution, progress, and stats; return to initial state.

## 10) Visual & Interaction Specs

- Scene: isometric transforms with smooth transitions on scale/fit; preserve‑3d.
- Layer separation: consistent Z spacing for clear layer edges.
- Squares: base cell size scales with fit; borders remain visible; checkerboard
  for unvisited; gradient fill for visited with high‑contrast numbers.
- Knight: GLB renders within cell bounds; shadow enabled; non‑interactive.
- Path: semi‑transparent strokes (≈2px) drawn in a scene‑anchored overlay.
- Legend: compact gradient bar near the scene’s top‑left corner, labelled `1`
  and `total squares`.
- Header: title + subtitle; progress; status; layers; performance stats (post‑solve).
- Controls: centered below the scene — Back, Play/Pause, Forward, Reset; speed
  slider; Show Numbers; Fit to View; two color inputs for gradient start/end.

## 11) Algorithm Requirements

- Generate moves: permutations of `(±2, ±1, 0)` (x,y,z), unique tuples.
- Filter moves: in‑bounds and not yet visited.
- Sort moves: ascending by onward degree (Warnsdorf).
- DFS: push/pop positions, count backtracks, short‑circuit on full length.
- Limits: stop when time or backtracks exceed configured thresholds.
- Return: full `solution` if found; otherwise `solution = []` with `hitLimit`
  and optional `reason`.

## 12) Performance Targets

- Solve time: ≤ 5,000 ms or exit early with a clear message.
- Animation: 60 FPS target for transforms; stepping at 1–10 steps/sec.
- Resize: fit/align converges within ~1 animation frame; no jarring jumps.

## 13) Accessibility

- Controls use standard, tabbable inputs and buttons.
- Move‑number overlays auto‑switch black/white to maintain legibility.
- Tooltips are supplemental; core info (numbers) appears inline when enabled.

## 14) Configuration & Theming

- Default theme: dark, with a compatible light palette.
- Optional environment variables (build/runtime):
  - App `<title>` and icon (used in `<head>`)
  - Optional analytics script URL/id (deferred)
- Persistence via localStorage: `gradientStart`, `gradientEnd`, `showNumbers`.

## 15) Error Handling

- Solver: alerts with a specific reason when available or with a clear
  limits/unsolved message.
- Render: global error boundary shows a styled crash UI with a reload button.

## 16) Compatibility

- Desktop: current Chrome, Edge, Firefox, Safari.
- Mobile: Safari/Chrome; scene scales and remains usable.
- Network: GLB served locally; core features work after initial load.

## 17) Assets

- 3D knight model: `/models/knight.glb` (GLB)
- No mandatory external assets for core functionality.

## 18) Build & Runtime

- Development: Vite dev server with HMR.
- Production: build client to `dist/public`; bundle server; Express serves
  static assets and catches all routes to `index.html`.

## 19) Acceptance Test Checklist

- Initial view: header, legend, empty board; knight at `{0,0,0}`.
- Play: solver completes or alerts within ≤ 5s; on success, stats appear and
  animation starts.
- Controls: Pause/Resume works; Step ±1 respects bounds; Reset restores initial
  state; Fit to View frames all layers; Show Numbers toggles instantly; color
  pickers update visited fills.
- Persistence: refresh keeps gradient colors and show‑number preference.
- Layout: scene visible and aligned on 1280×800 and 1440×900; top board sits
  beneath header; legend anchored top‑left.
- Routing: unknown paths show 404 with working “Go Home”.

## 20) Out of Scope (Code Present but Not Product Features)

- UI to change board size, layer count, or start position (internal state
  exists; no exposed controls).
- Map components or Google Maps integrations.
- Authentication dialogs or third‑party OAuth flows.
- Server APIs beyond static file serving.
