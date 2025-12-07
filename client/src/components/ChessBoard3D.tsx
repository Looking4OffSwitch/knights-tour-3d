import { useRef, useMemo } from "react";
import { generateGradient, getGradientColor } from "@/lib/gradientUtils";
import { xToFile } from "@/lib/knightsTour";

interface Position {
  x: number;
  y: number;
  layer: number;
}

/** Coordinate display mode options */
type CoordinateDisplayMode = "all" | "bottom" | "top" | "current";

interface ChessBoard3DProps {
  layers: number;
  boardSize: number;
  knightPosition: Position | null;
  visitedSquares: Position[];
  path: Position[];
  zoom?: number;
  verticalSpacing?: number;
  verticalOffset?: number;
  knightScale?: number;
  gradientStart?: string;
  gradientEnd?: string;
  occlusionZoneRadius?: number;
  occlusionEnabled?: boolean;
  /** Whether to show board coordinates (files and ranks) */
  showCoordinates?: boolean;
  /** Which layers should display coordinates */
  coordinateDisplayMode?: CoordinateDisplayMode;
  /** The layer the knight is currently on (for "current" display mode) */
  currentKnightLayer?: number;
}

export default function ChessBoard3D({
  layers,
  boardSize,
  knightPosition,
  visitedSquares,
  path,
  zoom = 1.0,
  verticalSpacing = 120,
  verticalOffset = 0,
  knightScale = 2.4,
  gradientStart = "#004f44",
  gradientEnd = "#22a75e",
  occlusionZoneRadius = 1,
  occlusionEnabled = false,
  showCoordinates = false,
  coordinateDisplayMode = "all",
  currentKnightLayer = 0,
}: ChessBoard3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate gradient colors for the path
  // Memoized to only recalculate when gradient settings or path length changes
  const pathGradient = useMemo(() => {
    try {
      // Generate gradient based on path length (number of steps in the tour)
      // If path is empty, generate at least 2 colors for preview purposes
      const steps = Math.max(path.length, 2);
      return generateGradient(gradientStart, gradientEnd, steps);
    } catch (error) {
      // Fallback to default gradient if color parsing fails (#004f44 -> #22a75e)
      console.error("Failed to generate gradient:", error);
      return generateGradient("#004f44", "#22a75e", Math.max(path.length, 2));
    }
  }, [gradientStart, gradientEnd, path.length]);

  // Fixed orientation for top-down isometric view (matching reference image)
  const rotationX = 60; // More top-down angle
  const rotationZ = 45; // 45-degree isometric angle

  // Use zoom prop as scale factor
  const scaleFactor = zoom;

  const isVisited = (x: number, y: number, layer: number): boolean => {
    return visitedSquares.some(
      pos => pos.x === x && pos.y === y && pos.layer === layer
    );
  };

  const getPathIndex = (x: number, y: number, layer: number): number => {
    return path.findIndex(
      pos => pos.x === x && pos.y === y && pos.layer === layer
    );
  };

  const isKnightPosition = (x: number, y: number, layer: number): boolean => {
    return (
      knightPosition !== null &&
      knightPosition.x === x &&
      knightPosition.y === y &&
      knightPosition.layer === layer
    );
  };

  /**
   * Determines if a square should be made transparent to reveal the knight below
   *
   * Uses a simple zone-based approach: if the knight is on a lower layer,
   * squares directly above it (within a configurable zone radius) become transparent
   * to ensure the knight remains visible.
   *
   * @param x - Square's X coordinate
   * @param y - Square's Y coordinate
   * @param currentLayer - The layer this square is on
   * @param zoneRadius - Radius of the transparency zone (0 = exact position only, 1 = 3x3 grid, 2 = 5x5 grid, etc.)
   * @returns Object with transparency state and whether square is in occlusion zone
   */
  const getSquareOcclusionState = (
    x: number,
    y: number,
    currentLayer: number,
    zoneRadius: number
  ): { isOccluding: boolean; distanceFromKnight: number } => {
    // Occlusion system disabled - no transparency
    if (!occlusionEnabled) {
      return { isOccluding: false, distanceFromKnight: Infinity };
    }

    // No knight or knight is on this layer or above - no occlusion
    if (!knightPosition || knightPosition.layer >= currentLayer) {
      return { isOccluding: false, distanceFromKnight: Infinity };
    }

    // Calculate if this square is within the occlusion zone
    // The zone is a square grid centered on the knight's position
    const deltaX = Math.abs(x - knightPosition.x);
    const deltaY = Math.abs(y - knightPosition.y);

    // Use Chebyshev distance (max of x and y differences) for square grid
    const distanceFromKnight = Math.max(deltaX, deltaY);

    // Square is occluding if it's within the zone radius
    const isOccluding = distanceFromKnight <= zoneRadius;

    return { isOccluding, distanceFromKnight };
  };

  // Convert board coordinates to 3D position
  const getSquarePosition = (x: number, y: number, layer: number) => {
    const cellSize = 40 * scaleFactor;

    return {
      x: (x - boardSize / 2 + 0.5) * cellSize,
      y: (y - boardSize / 2 + 0.5) * cellSize,
      z: layer * verticalSpacing,
    };
  };

  /**
   * Determines if coordinates should be displayed for a given layer
   * based on the current display mode setting.
   *
   * @param layerIndex - The layer index to check (0-indexed)
   * @returns true if coordinates should be shown on this layer
   */
  const shouldShowCoordinatesForLayer = (layerIndex: number): boolean => {
    if (!showCoordinates) return false;

    switch (coordinateDisplayMode) {
      case "all":
        return true;
      case "bottom":
        return layerIndex === 0;
      case "top":
        return layerIndex === layers - 1;
      case "current":
        return layerIndex === currentKnightLayer;
      default:
        console.warn(`Unknown coordinate display mode: ${coordinateDisplayMode}`);
        return false;
    }
  };

  /**
   * Generates file letters (a-h) for coordinate display.
   * Memoized to avoid recalculation on every render.
   */
  const fileLetters = useMemo(() => {
    return Array.from({ length: boardSize }, (_, i) => {
      try {
        return xToFile(i, boardSize);
      } catch (error) {
        console.error(`Failed to get file letter for index ${i}:`, error);
        return "?";
      }
    });
  }, [boardSize]);

  /**
   * Generates rank numbers (1-8) for coordinate display.
   * Ranks are displayed from 1 at bottom to 8 at top in standard chess.
   */
  const rankNumbers = useMemo(() => {
    return Array.from({ length: boardSize }, (_, i) => (i + 1).toString());
  }, [boardSize]);

  const cellSize = 40 * scaleFactor;

  /** Size of coordinate labels relative to cell size */
  const coordinateLabelSize = cellSize * 0.4;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[600px] py-12 gap-12">
      <div className="relative flex flex-col items-center gap-12">
        <div
          ref={containerRef}
          className="relative"
          style={{
            width: "800px",
            height: "600px",
            perspective: "2000px",
          }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateY(${verticalOffset}px) rotateX(${rotationX}deg) rotateZ(${rotationZ}deg) scale(${scaleFactor})`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {/* Path Lines */}
            {path.length > 1 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: "translateZ(5px)",
                }}
              >
                {path.slice(0, -1).map((pos, i) => {
                  const nextPos = path[i + 1];
                  const start = getSquarePosition(pos.x, pos.y, pos.layer);
                  const end = getSquarePosition(
                    nextPos.x,
                    nextPos.y,
                    nextPos.layer
                  );

                  return (
                    <line
                      key={i}
                      x1={start.x + 400}
                      y1={start.y + 300 - start.z}
                      x2={end.x + 400}
                      y2={end.y + 300 - end.z}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                  );
                })}
              </svg>
            )}

            {/* Render layers from top to bottom */}
            {Array.from({ length: layers }, (_, layerIndex) => {
              const actualLayer = layers - 1 - layerIndex;
              return (
                <div
                  key={actualLayer}
                  className="absolute"
                  style={{
                    transform: `translateZ(${actualLayer * verticalSpacing}px)`,
                    transformStyle: "preserve-3d",
                    left: "50%",
                    top: "50%",
                    marginLeft: `${(-boardSize * cellSize) / 2}px`,
                    marginTop: `${(-boardSize * cellSize) / 2}px`,
                  }}
                >
                  {/* Render board squares */}
                  {Array.from({ length: boardSize }, (_, y) =>
                    Array.from({ length: boardSize }, (_, x) => {
                      const visited = isVisited(x, y, actualLayer);
                      const pathIdx = getPathIndex(x, y, actualLayer);
                      const hasKnight = isKnightPosition(x, y, actualLayer);

                      // Check if this square is occluding the knight below
                      const occlusionState = getSquareOcclusionState(
                        x,
                        y,
                        actualLayer,
                        occlusionZoneRadius
                      );

                      // Get gradient color for visited squares based on path index
                      const gradientColor =
                        visited && pathIdx >= 0
                          ? getGradientColor(pathGradient, pathIdx)
                          : null;

                      // Determine border color: amber for occluding squares, normal otherwise
                      const borderColor = occlusionState.isOccluding
                        ? "border-amber-500/70"
                        : visited
                          ? "border-border/50"
                          : "border-border/30";

                      return (
                        <div
                          key={`${x}-${y}`}
                          className={`absolute border-2 flex items-center justify-center text-xs font-semibold transition-all duration-200 ${borderColor} ${
                            visited
                              ? ""
                              : (x + y) % 2 === 0
                                ? "bg-primary/20"
                                : "bg-primary/40"
                          }`}
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            left: `${x * cellSize}px`,
                            top: `${y * cellSize}px`,
                            // Apply semi-transparency to occluding squares (0.2 = 20% opacity)
                            opacity: occlusionState.isOccluding ? 0.2 : 1,
                            backgroundColor: gradientColor || undefined,
                            boxShadow: gradientColor
                              ? `0 4px 6px -1px ${gradientColor}40, 0 2px 4px -1px ${gradientColor}30`
                              : undefined,
                          }}
                        >
                          {/* Path number */}
                          {visited && pathIdx >= 0 && (
                            <span className="text-primary-foreground font-bold text-[11px]">
                              {pathIdx + 1}
                            </span>
                          )}

                          {/* Knight piece */}
                          {hasKnight && (
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                fontSize: `${cellSize * knightScale}px`,
                                lineHeight: 0,
                                transform:
                                  "translate(-50%, -50%) translateZ(15px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  verticalAlign: "middle",
                                }}
                              >
                                ♞
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Board Coordinates - File letters along top edge */}
                  {shouldShowCoordinatesForLayer(actualLayer) && (
                    <>
                      {/* File letters (a-h) along the top edge */}
                      {fileLetters.map((letter, x) => (
                        <div
                          key={`file-${x}`}
                          className="absolute flex items-center justify-center text-muted-foreground font-semibold pointer-events-none"
                          style={{
                            fontSize: `${coordinateLabelSize}px`,
                            width: `${cellSize}px`,
                            height: `${coordinateLabelSize}px`,
                            left: `${x * cellSize}px`,
                            top: `${-coordinateLabelSize - 4}px`,
                          }}
                        >
                          {letter}
                        </div>
                      ))}

                      {/* Rank numbers (1-8) along the right edge */}
                      {rankNumbers.map((rank, y) => (
                        <div
                          key={`rank-${y}`}
                          className="absolute flex items-center justify-center text-muted-foreground font-semibold pointer-events-none"
                          style={{
                            fontSize: `${coordinateLabelSize}px`,
                            width: `${coordinateLabelSize}px`,
                            height: `${cellSize}px`,
                            left: `${boardSize * cellSize + 4}px`,
                            top: `${y * cellSize}px`,
                          }}
                        >
                          {rank}
                        </div>
                      ))}

                      {/* Layer label (L1, L2, L3) in top-right corner */}
                      <div
                        className="absolute flex items-center justify-center text-primary font-bold pointer-events-none"
                        style={{
                          fontSize: `${coordinateLabelSize * 1.2}px`,
                          left: `${boardSize * cellSize + 4}px`,
                          top: `${-coordinateLabelSize - 4}px`,
                        }}
                      >
                        L{actualLayer + 1}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
