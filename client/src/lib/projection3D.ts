/**
 * 3D Projection Utilities
 *
 * This module provides functions for projecting 3D coordinates to 2D screen space,
 * accounting for CSS 3D transforms (rotateX, rotateZ, perspective) used in the
 * Knight's Tour 3D visualization.
 *
 * The projection pipeline matches CSS transform order:
 * 1. Apply rotateX (tilt around X-axis)
 * 2. Apply rotateZ (rotate around Z-axis)
 * 3. Apply scale
 * 4. Apply perspective projection
 *
 * @module projection3D
 */

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Represents a point in 3D space
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Represents a point in 2D screen space
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Represents an axis-aligned bounding box in 2D screen space
 */
export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Configuration for the 3D projection system
 */
export interface ProjectionConfig {
  /** Rotation around X-axis in degrees (tilt angle) */
  rotateXDeg: number;
  /** Rotation around Z-axis in degrees (isometric angle) */
  rotateZDeg: number;
  /** Scale factor (zoom level) */
  scale: number;
  /** Perspective distance in pixels (camera distance from scene) */
  perspectiveDistance: number;
  /** Vertical offset applied before rotation */
  verticalOffset: number;
}

/**
 * Represents a square on the chess board with its 3D corners
 */
export interface Square3D {
  /** Board X coordinate (0-7 for standard chess) */
  boardX: number;
  /** Board Y coordinate (0-7 for standard chess) */
  boardY: number;
  /** Layer index (0 = bottom) */
  layer: number;
  /** The four corners of the square in 3D space */
  corners: [Point3D, Point3D, Point3D, Point3D];
}

// =============================================================================
// Constants
// =============================================================================

/** Conversion factor from degrees to radians */
const DEG_TO_RAD = Math.PI / 180;

/** Enable debug logging for projection calculations */
const DEBUG_PROJECTION = false;

// =============================================================================
// Matrix Operations
// =============================================================================

/**
 * Converts degrees to radians
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function degreesToRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/**
 * Applies rotation around the X-axis to a 3D point
 *
 * Rotation matrix for X-axis:
 * [1,    0,         0    ]
 * [0,  cos(θ),  -sin(θ) ]
 * [0,  sin(θ),   cos(θ) ]
 *
 * @param point - The 3D point to rotate
 * @param angleDeg - Rotation angle in degrees
 * @returns New rotated point
 */
export function rotateX(point: Point3D, angleDeg: number): Point3D {
  const rad = degreesToRadians(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
}

/**
 * Applies rotation around the Z-axis to a 3D point
 *
 * Rotation matrix for Z-axis:
 * [cos(θ), -sin(θ), 0]
 * [sin(θ),  cos(θ), 0]
 * [  0,       0,    1]
 *
 * @param point - The 3D point to rotate
 * @param angleDeg - Rotation angle in degrees
 * @returns New rotated point
 */
export function rotateZ(point: Point3D, angleDeg: number): Point3D {
  const rad = degreesToRadians(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  };
}

/**
 * Applies scale transformation to a 3D point
 *
 * @param point - The 3D point to scale
 * @param scale - Scale factor
 * @returns New scaled point
 */
export function scale3D(point: Point3D, scale: number): Point3D {
  return {
    x: point.x * scale,
    y: point.y * scale,
    z: point.z * scale,
  };
}

// =============================================================================
// Projection Functions
// =============================================================================

/**
 * Projects a 3D point to 2D screen space using perspective projection
 *
 * The perspective formula is:
 *   screenX = x * (perspective / (perspective - z))
 *   screenY = y * (perspective / (perspective - z))
 *
 * This matches CSS perspective behavior where objects further from the
 * viewer (positive Z moving away) appear smaller.
 *
 * @param point - The 3D point to project
 * @param perspectiveDistance - Distance from viewer to projection plane
 * @returns 2D screen coordinates
 */
export function perspectiveProject(
  point: Point3D,
  perspectiveDistance: number
): Point2D {
  // Prevent division by zero or negative perspective
  if (perspectiveDistance <= 0) {
    console.error("perspectiveProject: perspectiveDistance must be positive");
    return { x: point.x, y: point.y };
  }

  // CSS perspective: objects with higher Z (closer to viewer) appear larger
  // The formula accounts for the viewer being at z = perspectiveDistance
  const scale = perspectiveDistance / (perspectiveDistance - point.z);

  // Clamp scale to prevent extreme values for points very close to camera
  const clampedScale = Math.max(0.01, Math.min(scale, 100));

  return {
    x: point.x * clampedScale,
    y: point.y * clampedScale,
  };
}

/**
 * Applies the full transform pipeline to a 3D point, converting it to screen space
 *
 * Transform order (matching CSS):
 * 1. rotateX (tilt)
 * 2. rotateZ (isometric rotation)
 * 3. scale
 * 4. perspective projection
 *
 * @param point - The 3D point in world coordinates
 * @param config - Projection configuration
 * @returns 2D screen coordinates
 */
export function projectToScreen(
  point: Point3D,
  config: ProjectionConfig
): Point2D {
  if (DEBUG_PROJECTION) {
    console.debug("projectToScreen input:", point, config);
  }

  // Step 1: Apply rotateX (tilt the view)
  let transformed = rotateX(point, config.rotateXDeg);

  // Step 2: Apply rotateZ (isometric rotation)
  transformed = rotateZ(transformed, config.rotateZDeg);

  // Step 3: Apply scale
  transformed = scale3D(transformed, config.scale);

  // Step 4: Apply perspective projection
  const projected = perspectiveProject(transformed, config.perspectiveDistance);

  if (DEBUG_PROJECTION) {
    console.debug("projectToScreen output:", projected);
  }

  return projected;
}

// =============================================================================
// Bounding Box Functions
// =============================================================================

/**
 * Calculates the 2D bounding box of a set of 2D points
 *
 * @param points - Array of 2D points
 * @returns Axis-aligned bounding box containing all points
 */
export function calculateBoundingBox(points: Point2D[]): BoundingBox2D {
  if (points.length === 0) {
    console.warn("calculateBoundingBox: empty points array");
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Checks if two 2D bounding boxes overlap
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns true if the boxes overlap, false otherwise
 */
export function boundingBoxesOverlap(
  a: BoundingBox2D,
  b: BoundingBox2D
): boolean {
  // Two boxes don't overlap if one is completely to the left, right, above, or below the other
  const noOverlap =
    a.maxX < b.minX || // a is to the left of b
    a.minX > b.maxX || // a is to the right of b
    a.maxY < b.minY || // a is above b
    a.minY > b.maxY; // a is below b

  return !noOverlap;
}

/**
 * Calculates the area of overlap between two bounding boxes
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns Area of overlap (0 if no overlap)
 */
export function calculateOverlapArea(
  a: BoundingBox2D,
  b: BoundingBox2D
): number {
  const overlapMinX = Math.max(a.minX, b.minX);
  const overlapMaxX = Math.min(a.maxX, b.maxX);
  const overlapMinY = Math.max(a.minY, b.minY);
  const overlapMaxY = Math.min(a.maxY, b.maxY);

  const width = overlapMaxX - overlapMinX;
  const height = overlapMaxY - overlapMinY;

  if (width <= 0 || height <= 0) {
    return 0;
  }

  return width * height;
}

// =============================================================================
// Square Projection Functions
// =============================================================================

/**
 * Creates a Square3D object with its four corners in 3D world space
 *
 * The square is positioned based on board coordinates and cell size.
 * Origin (0,0) is at the center of the board.
 *
 * @param boardX - X coordinate on the board (0 to boardSize-1)
 * @param boardY - Y coordinate on the board (0 to boardSize-1)
 * @param layer - Layer index (0 = bottom layer)
 * @param cellSize - Size of each cell in pixels
 * @param boardSize - Number of cells per side (e.g., 8 for standard chess)
 * @param verticalSpacing - Vertical distance between layers in pixels
 * @returns Square3D object with corner positions
 */
export function createSquare3D(
  boardX: number,
  boardY: number,
  layer: number,
  cellSize: number,
  boardSize: number,
  verticalSpacing: number
): Square3D {
  // Calculate world position (centered at origin)
  const worldX = (boardX - boardSize / 2) * cellSize;
  const worldY = (boardY - boardSize / 2) * cellSize;
  const worldZ = layer * verticalSpacing;

  // Define the four corners of the square
  const corners: [Point3D, Point3D, Point3D, Point3D] = [
    { x: worldX, y: worldY, z: worldZ }, // Top-left
    { x: worldX + cellSize, y: worldY, z: worldZ }, // Top-right
    { x: worldX + cellSize, y: worldY + cellSize, z: worldZ }, // Bottom-right
    { x: worldX, y: worldY + cellSize, z: worldZ }, // Bottom-left
  ];

  return {
    boardX,
    boardY,
    layer,
    corners,
  };
}

/**
 * Projects a Square3D to screen space and returns its 2D bounding box
 *
 * @param square - The 3D square to project
 * @param config - Projection configuration
 * @returns 2D bounding box of the projected square
 */
export function projectSquareToScreen(
  square: Square3D,
  config: ProjectionConfig
): BoundingBox2D {
  const projectedCorners = square.corners.map((corner) =>
    projectToScreen(corner, config)
  );

  return calculateBoundingBox(projectedCorners);
}

/**
 * Creates a 3D point for the knight's position (center of its square)
 *
 * @param boardX - X coordinate on the board
 * @param boardY - Y coordinate on the board
 * @param layer - Layer index
 * @param cellSize - Size of each cell in pixels
 * @param boardSize - Number of cells per side
 * @param verticalSpacing - Vertical distance between layers
 * @param knightZOffset - Z offset for knight above its square (default 15px)
 * @returns 3D point at the knight's center position
 */
export function createKnightPosition3D(
  boardX: number,
  boardY: number,
  layer: number,
  cellSize: number,
  boardSize: number,
  verticalSpacing: number,
  knightZOffset: number = 15
): Point3D {
  // Knight is at the center of its cell
  const worldX = (boardX - boardSize / 2 + 0.5) * cellSize;
  const worldY = (boardY - boardSize / 2 + 0.5) * cellSize;
  const worldZ = layer * verticalSpacing + knightZOffset;

  return { x: worldX, y: worldY, z: worldZ };
}

/**
 * Creates a bounding box for the knight in screen space
 *
 * The knight's bounding box is approximated as a square centered on its position.
 *
 * @param knightPos3D - Knight's 3D position
 * @param config - Projection configuration
 * @param knightSize - Size of the knight in screen pixels
 * @returns 2D bounding box for the knight
 */
export function projectKnightToScreen(
  knightPos3D: Point3D,
  config: ProjectionConfig,
  knightSize: number
): BoundingBox2D {
  const center = projectToScreen(knightPos3D, config);
  const halfSize = knightSize / 2;

  return {
    minX: center.x - halfSize,
    maxX: center.x + halfSize,
    minY: center.y - halfSize,
    maxY: center.y + halfSize,
  };
}

// =============================================================================
// Debug Utilities
// =============================================================================

/**
 * Formats a bounding box for debug logging
 *
 * @param box - Bounding box to format
 * @returns Formatted string representation
 */
export function formatBoundingBox(box: BoundingBox2D): string {
  return `[${box.minX.toFixed(1)}, ${box.minY.toFixed(1)}] -> [${box.maxX.toFixed(1)}, ${box.maxY.toFixed(1)}]`;
}

/**
 * Formats a Point3D for debug logging
 *
 * @param point - Point to format
 * @returns Formatted string representation
 */
export function formatPoint3D(point: Point3D): string {
  return `(${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)})`;
}
