import { useRef, useMemo } from "react";
import { generateGradient, getGradientColor } from "@/lib/gradientUtils";

interface Position {
  x: number;
  y: number;
  layer: number;
}

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

  const cellSize = 40 * scaleFactor;

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
                      const gradientColor = visited && pathIdx >= 0
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
                            boxShadow: gradientColor ? `0 4px 6px -1px ${gradientColor}40, 0 2px 4px -1px ${gradientColor}30` : undefined,
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
                                transform: "translate(-50%, -50%) translateZ(15px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span style={{ display: "inline-block", verticalAlign: "middle" }}>♞</span>
                            </div>
                          )}
                        </div>
                      );
                    })
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
