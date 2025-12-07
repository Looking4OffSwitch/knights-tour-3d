import { useEffect, useRef, useMemo, useCallback, useState } from "react";
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
 * - Auto-scrolls to keep the current move visible when simulation is running
 * - Respects user manual scrolling - disables auto-scroll when user scrolls
 * - Re-enables auto-scroll when simulation restarts
 * - Highlights the current move being displayed
 * - Shows move count header
 * - Displays empty state when no moves available
 *
 * @example
 * <MoveList
 *   path={currentPath}
 *   boardSize={8}
 *   totalLayers={3}
 *   currentStep={5}
 *   isPlaying={true}
 *   maxHeight={300}
 * />
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
  // Reference to the scrollable viewport element
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  // Reference to the currently active move item for scroll-into-view
  const activeMoveRef = useRef<HTMLDivElement>(null);

  /**
   * Tracks whether auto-scroll is enabled.
   * Disabled when user manually scrolls, re-enabled when simulation restarts.
   */
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  /**
   * Tracks the previous path length to detect simulation restart.
   * When path length decreases (reset) or goes to 0, we re-enable auto-scroll.
   */
  const prevPathLengthRef = useRef(0);

  /**
   * Tracks if we're currently performing a programmatic scroll.
   * Used to distinguish between user scrolls and auto-scrolls.
   */
  const isProgrammaticScrollRef = useRef(false);

  /**
   * Memoized move list computation
   * Only recalculates when path, boardSize, or totalLayers change
   */
  const moves: ChessMove[] = useMemo(() => {
    console.debug(`MoveList: computing moves for path length ${path.length}`);
    return formatMoveList(path, boardSize, totalLayers);
  }, [path, boardSize, totalLayers]);

  /**
   * The index of the move that should be highlighted
   * currentStep is the position index (0 = start position, 1 = after first move)
   * So the active move index is currentStep - 1 (since moves start from position 1)
   */
  const activeMoveIndex = currentStep > 0 ? currentStep - 1 : -1;

  /**
   * Detect simulation restart/reset and re-enable auto-scroll.
   * A restart is detected when:
   * - Path length becomes 0 or 1 (reset)
   * - Path length decreases significantly (reset during playback)
   */
  useEffect(() => {
    const currentLength = path.length;
    const prevLength = prevPathLengthRef.current;

    // Detect reset: path length decreased or went to start
    if (currentLength <= 1 || currentLength < prevLength - 1) {
      console.debug("MoveList: detected simulation reset, re-enabling auto-scroll");
      setAutoScrollEnabled(true);
    }

    prevPathLengthRef.current = currentLength;
  }, [path.length]);

  /**
   * Handle user scroll events.
   * Disables auto-scroll when user manually scrolls during playback.
   */
  const handleScroll = useCallback(() => {
    // Ignore programmatic scrolls
    if (isProgrammaticScrollRef.current) {
      return;
    }

    // Only disable auto-scroll if simulation is playing
    // This allows user to scroll freely when paused without affecting future auto-scroll
    if (isPlaying && autoScrollEnabled) {
      console.debug("MoveList: user scrolled during playback, disabling auto-scroll");
      setAutoScrollEnabled(false);
    }
  }, [isPlaying, autoScrollEnabled]);

  /**
   * Set up scroll event listener on the viewport.
   */
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    // Find the actual scrollable element within ScrollArea
    const scrollableElement = viewport.querySelector("[data-radix-scroll-area-viewport]");
    if (!scrollableElement) {
      console.debug("MoveList: scrollable viewport not found");
      return;
    }

    scrollableElement.addEventListener("scroll", handleScroll);

    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  /**
   * Auto-scroll to keep the active move visible.
   * Only scrolls when:
   * - Auto-scroll is enabled (user hasn't manually scrolled)
   * - Simulation is playing
   * - There's an active move to scroll to
   */
  useEffect(() => {
    if (!autoScrollEnabled || !isPlaying || !activeMoveRef.current) {
      return;
    }

    // Mark this as a programmatic scroll to avoid triggering handleScroll
    isProgrammaticScrollRef.current = true;

    activeMoveRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

    // Reset the flag after a short delay to allow the scroll to complete
    const timeoutId = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activeMoveIndex, autoScrollEnabled, isPlaying]);

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
      <div ref={scrollViewportRef} className="flex-1 min-h-0">
        <ScrollArea
          className="px-2 h-full"
        >
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
