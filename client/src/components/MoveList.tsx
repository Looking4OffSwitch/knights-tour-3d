import { useEffect, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  formatMoveList,
  type Position,
  type ChessMove,
} from "@/lib/knightsTour";

/**
 * Props for the MoveList component
 */
interface MoveListProps {
  /** The current path of positions visited by the knight */
  path: Position[];
  /** The size of the chess board (e.g., 8 for standard 8x8) */
  boardSize: number;
  /** Total number of layers/boards in the 3D configuration */
  totalLayers: number;
  /** The current step index being displayed (0-indexed) */
  currentStep: number;
  /** Whether the simulation is currently playing (not paused) */
  isPlaying?: boolean;
  /** Maximum height of the scrollable area in pixels */
  maxHeight?: number;
  /** Callback when a move is clicked (receives the step index to navigate to) */
  onMoveClick?: (stepIndex: number) => void;
}

/**
 * MoveList Component
 *
 * Displays a scrollable list of chess moves in standard notation format.
 * Each move shows the move number, starting position, and ending position
 * with layer prefixes (e.g., "1. L1:a1 → L1:c2").
 *
 * Features:
 * - Always auto-scrolls to keep the current move visible
 * - Highlights the current move being displayed
 * - Shows move count header
 * - Displays empty state when no moves available
 * - Click on a move to navigate (when paused)
 */
export function MoveList({
  path,
  boardSize,
  totalLayers,
  currentStep,
  isPlaying = false,
  maxHeight = 280,
  onMoveClick,
}: MoveListProps) {
  // Reference to the currently active move item for scroll-into-view
  const activeMoveRef = useRef<HTMLDivElement>(null);

  /**
   * Memoized move list computation
   * Only recalculates when path, boardSize, or totalLayers change
   */
  const moves: ChessMove[] = useMemo(() => {
    return formatMoveList(path, boardSize, totalLayers);
  }, [path, boardSize, totalLayers]);

  /**
   * The index of the move that should be highlighted
   * currentStep is the position index (0 = start position, 1 = after first move)
   * So the active move index is currentStep - 1 (since moves start from position 1)
   */
  const activeMoveIndex = currentStep > 0 ? currentStep - 1 : -1;

  /**
   * Always scroll to keep the active move visible when it changes
   */
  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeMoveIndex]);

  // Calculate total moves (transitions between positions)
  const totalMoves = path.length > 1 ? path.length - 1 : 0;
  const completedMoves = currentStep > 0 ? Math.min(currentStep, totalMoves) : 0;

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      {/* Header showing move count */}
      <div className="px-4 py-3 border-b border-border/50 bg-card/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Move List</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalMoves > 0
            ? `${completedMoves} of ${totalMoves} moves`
            : "No moves yet"}
        </p>
      </div>

      {/* Scrollable move list */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="px-2 h-full">
          {moves.length > 0 ? (
            <div className="py-2 space-y-1">
              {moves.map((move, index) => {
                const isActive = index === activeMoveIndex;
                const isPast = index < activeMoveIndex;
                // Clicking navigates to the step AFTER this move (index + 1)
                // e.g., clicking move 1 shows position after move 1
                const canClick = !isPlaying && onMoveClick;

                return (
                  <div
                    key={move.moveNumber}
                    ref={isActive ? activeMoveRef : null}
                    onClick={() => canClick && onMoveClick(index + 1)}
                    className={`
                      px-3 py-1.5 rounded-md text-xs font-mono transition-colors duration-150
                      ${isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : isPast
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                      }
                      ${canClick ? "cursor-pointer hover:bg-primary/10" : ""}
                    `}
                  >
                    {/* Move number */}
                    <span className={`
                      inline-block w-8 font-semibold
                      ${isActive ? "text-primary" : "text-muted-foreground"}
                    `}>
                      {move.moveNumber}.
                    </span>

                    {/* From position */}
                    <span className={isActive ? "text-primary" : ""}>
                      {move.from}
                    </span>

                    {/* Arrow separator */}
                    <span className="mx-2 text-muted-foreground/70">→</span>

                    {/* To position */}
                    <span className={isActive ? "text-primary font-semibold" : ""}>
                      {move.to}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="flex items-center justify-center h-full py-8">
              <p className="text-xs text-muted-foreground text-center">
                Start the tour to see moves
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

export default MoveList;
