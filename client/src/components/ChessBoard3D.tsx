import { useRef } from "react";

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
  controlButtons?: React.ReactNode;
}

export default function ChessBoard3D({
  layers,
  boardSize,
  knightPosition,
  visitedSquares,
  path,
  controlButtons,
}: ChessBoard3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fixed orientation for top-down isometric view (matching reference image)
  const rotationX = 60; // More top-down angle
  const rotationZ = 45; // 45-degree isometric angle

  // Dynamic scaling based on board size - zoom to maximize space
  const getScaleFactor = () => {
    if (boardSize === 5) return 1.8; // Zoom in significantly for 5x5
    if (boardSize === 10) return 0.6; // Zoom out for 10x10
    return 1.0; // 8x8 default
  };

  const scaleFactor = getScaleFactor();

  const isVisited = (x: number, y: number, layer: number): boolean => {
    return visitedSquares.some(
      (pos) => pos.x === x && pos.y === y && pos.layer === layer
    );
  };

  const getPathIndex = (x: number, y: number, layer: number): number => {
    return path.findIndex(
      (pos) => pos.x === x && pos.y === y && pos.layer === layer
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

  // Calculate which squares should be transparent based on knight position and viewing angle
  const shouldSquareBeTransparent = (x: number, y: number, layerIndex: number): boolean => {
    // Only apply transparency if knight is on a lower layer AND would be occluded
    if (!knightPosition || knightPosition.layer >= layerIndex) return false;

    // Check if the knight is actually occluded by checking if any upper layer square
    // would visually overlap with the knight's position from the current viewing angle
    const knightX = knightPosition.x;
    const knightY = knightPosition.y;

    // Calculate projection offset based on rotation angle and layer difference
    const layerDiff = layerIndex - knightPosition.layer;
    const angleRad = (rotationZ * Math.PI) / 180;
    const projectionOffsetX = Math.round(Math.sin(angleRad) * layerDiff * 2);
    const projectionOffsetY = Math.round(Math.cos(angleRad) * layerDiff * 2);

    const projectedX = knightX + projectionOffsetX;
    const projectedY = knightY + projectionOffsetY;

    // Only make transparent if this square actually occludes the knight
    // Check if current square overlaps with projected knight position (3x3 region)
    const inOcclusionZone =
      x >= projectedX - 1 &&
      x <= projectedX + 1 &&
      y >= projectedY - 1 &&
      y <= projectedY + 1;

    // Additionally check if the knight is actually behind this layer visually
    // by checking if the square is roughly above the knight's actual position
    const isAboveKnight =
      x >= knightX - 2 &&
      x <= knightX + 2 &&
      y >= knightY - 2 &&
      y <= knightY + 2;

    return inOcclusionZone && isAboveKnight;
  };

  // Convert board coordinates to 3D position
  const getSquarePosition = (x: number, y: number, layer: number) => {
    const cellSize = 40 * scaleFactor;
    const layerOffset = 120;
    
    return {
      x: (x - boardSize / 2 + 0.5) * cellSize,
      y: (y - boardSize / 2 + 0.5) * cellSize,
      z: layer * layerOffset,
    };
  };

  const cellSize = 40 * scaleFactor;
  const verticalSpacing = 120;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[600px] py-12 gap-6">
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
            transform: `rotateX(${rotationX}deg) rotateZ(${rotationZ}deg) scale(${scaleFactor})`,
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
                const end = getSquarePosition(nextPos.x, nextPos.y, nextPos.layer);

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
                    const isTransparent = shouldSquareBeTransparent(x, y, actualLayer);

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`absolute border flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                          visited
                            ? "bg-primary border-primary shadow-lg shadow-primary/50"
                            : (x + y) % 2 === 0
                            ? "bg-primary/20 border-border/30"
                            : "bg-primary/40 border-border/30"
                        }`}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          left: `${x * cellSize}px`,
                          top: `${y * cellSize}px`,
                          opacity: isTransparent ? 0.25 : 1,
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
                            className="absolute inset-0 flex items-center justify-center text-2xl"
                            style={{
                              transform: "translateZ(10px)",
                            }}
                          >
                            ♞
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
      
      {/* Control buttons positioned under Layer 1 */}
      {controlButtons && (
        <div className="flex gap-3">
          {controlButtons}
        </div>
      )}
    </div>
  );
}
