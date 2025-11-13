# Knight's Tour 3D Visualizer - TODO

## Core Features

- [x] 3D chessboard visualization with layer support (1-3 layers)
- [x] Knight piece rendering on the board
- [x] Layer selector UI (1, 2, or 3 layers)
- [x] Knight's tour algorithm implementation with backtracking
- [x] Warnsdorf's heuristic for better performance
- [x] Real-time visualization of algorithm progress
- [x] Animation controls (play, pause, reset, speed control)
- [x] Starting position selector
- [x] Visual path highlighting showing visited squares
- [x] Move counter display
- [x] Algorithm status display (solving, solved, no solution)
- [x] Responsive design for different screen sizes

## Technical Implementation

- [x] 3D coordinate system (x, y, layer)
- [x] Valid move calculation for 3D boards
- [x] Animation state management
- [x] Performance optimization for smooth animations

## New Feature Requests

- [x] Isometric stacked board layout (matching reference image)
- [x] Proper vertical spacing between layers
- [x] Dynamic transparency for upper layers when knight is beneath them
- [x] Ensure knight is always visible regardless of layer position

## Latest Feature Requests

- [x] Mouse drag rotation controls for 3D view
- [x] Visual rotation buttons (rotate left/right, up/down)
- [x] 3D path line visualization connecting visited squares
- [x] Configurable board size selector (5×5, 8×8, 10×10)
- [x] Update algorithm to work with different board sizes

## New Feature Requests (Batch 2)

- [x] Pause button to pause/resume animation
- [x] Forward step button to advance one move at a time
- [x] Backward step button to go back one move
- [x] Display performance statistics (computation time, total moves, backtrack count)
- [x] Restrict rotation to horizontal axis only (side to side)
- [x] Dynamic board scaling (zoom in for 5×5, zoom out for 10×10)
- [x] Smart partial transparency - only make 3×3 section transparent above knight
- [x] Calculate transparent region dynamically based on viewing angle
- [x] Two-pane layout (large left pane for visualization, right pane for controls)
- [x] Collapsible control pane

## UI/UX Improvements and Bug Fixes

- [x] Change animation speed range from 1 to 10 (default: 1)
- [x] Change default number of layers to 3
- [x] Remove mouse drag rotation functionality
- [x] Show knight at selected starting position when not running
- [x] Update knight position immediately when starting position is changed
- [x] Move Status and Performance information into the header
- [x] Ensure side-panel collapse button is always visible
- [x] Move About information into a popup (info icon in header)
- [x] Fix transparency bug: only apply transparency when knight is actually occluded by upper boards

## Board Orientation and Layout Updates

- [x] Change board orientation to top-down isometric view (matching reference image)
- [x] Remove all rotation controls (buttons and functionality)
- [x] Remove layer text labels (Layer 1, Layer 2, Layer 3)
- [x] Position Start Tour and Reset buttons directly underneath Layer 1
- [x] Implement dynamic zoom based on board size (zoom in for 5×5, zoom out for 10×10)
- [x] Maximize board display within available space

## Bug Fixes and UI Polish

- [x] Fix "1 error" notification appearing on page load
- [x] Remove text from Start Tour button (icon only)
- [x] Change Start Tour button to Pause icon when tour is running
- [x] Make Start/Pause button toggle between play and pause states
- [x] Remove text from Reset button (icon only)
- [x] Make visited squares more visually distinct from unvisited squares
