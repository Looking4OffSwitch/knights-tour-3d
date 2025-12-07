export interface Position {
  x: number;
  y: number;
  layer: number;
}

export interface TourState {
  path: Position[];
  visited: Set<string>;
  isComplete: boolean;
  isSolving: boolean;
}

export interface TourResult {
  solution: Position[];
  backtracks: number;
}

// Knight moves in 2D (within a layer)
// Standard chess knight L-shape: 2 squares in one direction + 1 square perpendicular
const MOVES_2D = [
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
];

/**
 * Generates all valid 3D knight moves following the L-shape rule.
 *
 * A knight's L-shaped move consists of 2 steps in one axis and 1 step in a perpendicular axis.
 * In 3D, this extends to all axis combinations: (x,y), (x,z), and (y,z).
 *
 * The move patterns are:
 * - (±2, ±1, 0) and (±1, ±2, 0): Standard 2D moves on the same layer
 * - (±2, 0, ±1) and (±1, 0, ±2): L-shape in x-z plane (horizontal + vertical)
 * - (0, ±2, ±1) and (0, ±1, ±2): L-shape in y-z plane (horizontal + vertical)
 *
 * @returns Array of [dx, dy, dz] move vectors representing all valid L-shaped moves
 */
function generateKnight3DMoves(): number[][] {
  const moves: number[][] = [];

  // All permutations of the L-shape components: one axis gets ±2, another gets ±1, third gets 0
  // We iterate through which axis is 0, then assign ±2 and ±1 to the other two
  const axes = [0, 1, 2]; // x, y, z (layer)

  for (const zeroAxis of axes) {
    // The other two axes will have the ±2 and ±1 values
    const otherAxes = axes.filter(a => a !== zeroAxis);

    for (const twoAxis of otherAxes) {
      const oneAxis = otherAxes.find(a => a !== twoAxis)!;

      // Generate all sign combinations for ±2 and ±1
      for (const twoSign of [1, -1]) {
        for (const oneSign of [1, -1]) {
          const move = [0, 0, 0];
          move[twoAxis] = 2 * twoSign;
          move[oneAxis] = 1 * oneSign;
          // zeroAxis remains 0
          moves.push(move);
        }
      }
    }
  }

  return moves;
}

// Knight moves in 3D space - all valid L-shaped moves across three axes
// Total: 24 moves (8 for each plane: x-y, x-z, y-z)
const MOVES_3D = generateKnight3DMoves();

export function positionToKey(pos: Position): string {
  return `${pos.x},${pos.y},${pos.layer}`;
}

export function isValidPosition(
  x: number,
  y: number,
  layer: number,
  boardSize: number,
  layers: number
): boolean {
  return (
    x >= 0 &&
    x < boardSize &&
    y >= 0 &&
    y < boardSize &&
    layer >= 0 &&
    layer < layers
  );
}

export function getValidMoves(
  pos: Position,
  boardSize: number,
  layers: number,
  visited: Set<string>
): Position[] {
  const moves = layers > 1 ? MOVES_3D : MOVES_2D.map(([dx, dy]) => [dx, dy, 0]);
  const validMoves: Position[] = [];

  for (const [dx, dy, dz] of moves) {
    const newX = pos.x + dx;
    const newY = pos.y + dy;
    const newLayer = pos.layer + dz;

    if (
      isValidPosition(newX, newY, newLayer, boardSize, layers) &&
      !visited.has(positionToKey({ x: newX, y: newY, layer: newLayer }))
    ) {
      validMoves.push({ x: newX, y: newY, layer: newLayer });
    }
  }

  return validMoves;
}

// Warnsdorf's heuristic: prioritize moves with fewer onward options
export function sortMovesByWarnsdorf(
  moves: Position[],
  boardSize: number,
  layers: number,
  visited: Set<string>
): Position[] {
  return moves
    .map(move => ({
      move,
      accessibility: getValidMoves(move, boardSize, layers, visited).length,
    }))
    .sort((a, b) => a.accessibility - b.accessibility)
    .map(item => item.move);
}

export function solveKnightsTour(
  boardSize: number,
  layers: number,
  startPos: Position
): TourResult {
  const totalSquares = boardSize * boardSize * layers;
  const visited = new Set<string>();
  const path: Position[] = [];
  let backtracks = 0;

  visited.add(positionToKey(startPos));
  path.push(startPos);

  function backtrack(pos: Position): boolean {
    if (path.length === totalSquares) {
      return true;
    }

    const moves = getValidMoves(pos, boardSize, layers, visited);
    const sortedMoves = sortMovesByWarnsdorf(moves, boardSize, layers, visited);

    for (const nextPos of sortedMoves) {
      visited.add(positionToKey(nextPos));
      path.push(nextPos);

      if (backtrack(nextPos)) {
        return true;
      }

      // Backtrack
      backtracks++;
      visited.delete(positionToKey(nextPos));
      path.pop();
    }

    return false;
  }

  const success = backtrack(startPos);

  return {
    solution: success ? [...path] : [],
    backtracks,
  };
}

// =============================================================================
// Chess Notation Utilities
// =============================================================================

/** File letters for chess notation (a-h for standard 8x8 board) */
const FILE_LETTERS = "abcdefghijklmnopqrstuvwxyz";

/**
 * Converts an x coordinate to a chess file letter.
 *
 * @param x - The x coordinate (0-indexed, where 0 = 'a')
 * @param boardSize - The size of the board (used for validation)
 * @returns The file letter (e.g., 'a', 'b', 'c', etc.)
 * @throws Error if x is out of bounds or exceeds available file letters
 *
 * @example
 * xToFile(0, 8) // returns 'a'
 * xToFile(7, 8) // returns 'h'
 */
export function xToFile(x: number, boardSize: number): string {
  if (x < 0 || x >= boardSize) {
    console.error(`xToFile: x coordinate ${x} is out of bounds for board size ${boardSize}`);
    throw new Error(`Invalid x coordinate: ${x}. Must be between 0 and ${boardSize - 1}`);
  }

  if (x >= FILE_LETTERS.length) {
    console.error(`xToFile: x coordinate ${x} exceeds available file letters (max: ${FILE_LETTERS.length - 1})`);
    throw new Error(`Board size too large: x=${x} exceeds available file letters`);
  }

  return FILE_LETTERS[x];
}

/**
 * Converts a y coordinate to a chess rank number.
 *
 * In standard chess notation, ranks are numbered 1-8 from White's perspective,
 * where rank 1 is at the bottom. We follow the same convention: y=0 maps to rank 1.
 *
 * @param y - The y coordinate (0-indexed, where 0 = rank 1)
 * @param boardSize - The size of the board (used for validation)
 * @returns The rank number as a string (e.g., '1', '2', etc.)
 * @throws Error if y is out of bounds
 *
 * @example
 * yToRank(0, 8) // returns '1'
 * yToRank(7, 8) // returns '8'
 */
export function yToRank(y: number, boardSize: number): string {
  if (y < 0 || y >= boardSize) {
    console.error(`yToRank: y coordinate ${y} is out of bounds for board size ${boardSize}`);
    throw new Error(`Invalid y coordinate: ${y}. Must be between 0 and ${boardSize - 1}`);
  }

  // Chess ranks are 1-indexed (y=0 is rank 1, y=7 is rank 8)
  return (y + 1).toString();
}

/**
 * Converts a layer number to a board/layer notation string.
 *
 * Layers are displayed as "L1", "L2", etc. (1-indexed for user-friendliness).
 *
 * @param layer - The layer index (0-indexed)
 * @param totalLayers - Total number of layers (used for validation)
 * @returns The layer notation (e.g., 'L1', 'L2', 'L3')
 * @throws Error if layer is out of bounds
 *
 * @example
 * layerToNotation(0, 3) // returns 'L1'
 * layerToNotation(2, 3) // returns 'L3'
 */
export function layerToNotation(layer: number, totalLayers: number): string {
  if (layer < 0 || layer >= totalLayers) {
    console.error(`layerToNotation: layer ${layer} is out of bounds for ${totalLayers} layers`);
    throw new Error(`Invalid layer: ${layer}. Must be between 0 and ${totalLayers - 1}`);
  }

  // Layers are 1-indexed for display (L1, L2, L3, etc.)
  return `L${layer + 1}`;
}

/**
 * Converts a Position to chess notation with layer prefix.
 *
 * Format: "L<layer>:<file><rank>" (e.g., "L1:a1", "L2:e4", "L3:h8")
 *
 * @param pos - The position to convert
 * @param boardSize - The size of the board
 * @param totalLayers - Total number of layers
 * @returns Chess notation string with layer prefix
 * @throws Error if position coordinates are invalid
 *
 * @example
 * positionToChessNotation({ x: 0, y: 0, layer: 0 }, 8, 3) // returns 'L1:a1'
 * positionToChessNotation({ x: 4, y: 3, layer: 1 }, 8, 3) // returns 'L2:e4'
 */
export function positionToChessNotation(
  pos: Position,
  boardSize: number,
  totalLayers: number
): string {
  if (!pos) {
    console.error("positionToChessNotation: received null or undefined position");
    throw new Error("Position cannot be null or undefined");
  }

  const layer = layerToNotation(pos.layer, totalLayers);
  const file = xToFile(pos.x, boardSize);
  const rank = yToRank(pos.y, boardSize);

  return `${layer}:${file}${rank}`;
}

/**
 * Represents a single move in chess notation format.
 */
export interface ChessMove {
  /** The move number (1-indexed) */
  moveNumber: number;
  /** The starting position in chess notation (e.g., "L1:a1") */
  from: string;
  /** The ending position in chess notation (e.g., "L2:c2") */
  to: string;
  /** Full formatted move string (e.g., "1. L1:a1 → L2:c2") */
  formatted: string;
}

/**
 * Formats a single move from one position to another.
 *
 * @param moveNumber - The move number (1-indexed)
 * @param from - The starting position
 * @param to - The ending position
 * @param boardSize - The size of the board
 * @param totalLayers - Total number of layers
 * @returns A ChessMove object containing all notation details
 *
 * @example
 * formatMove(1, { x: 0, y: 0, layer: 0 }, { x: 2, y: 1, layer: 0 }, 8, 3)
 * // returns { moveNumber: 1, from: 'L1:a1', to: 'L1:c2', formatted: '1. L1:a1 → L1:c2' }
 */
export function formatMove(
  moveNumber: number,
  from: Position,
  to: Position,
  boardSize: number,
  totalLayers: number
): ChessMove {
  const fromNotation = positionToChessNotation(from, boardSize, totalLayers);
  const toNotation = positionToChessNotation(to, boardSize, totalLayers);

  return {
    moveNumber,
    from: fromNotation,
    to: toNotation,
    formatted: `${moveNumber}. ${fromNotation} → ${toNotation}`,
  };
}

/**
 * Converts an entire path into a list of formatted chess moves.
 *
 * @param path - Array of positions representing the knight's path
 * @param boardSize - The size of the board
 * @param totalLayers - Total number of layers
 * @returns Array of ChessMove objects, or empty array if path has fewer than 2 positions
 *
 * @example
 * const path = [
 *   { x: 0, y: 0, layer: 0 },
 *   { x: 2, y: 1, layer: 0 },
 *   { x: 4, y: 0, layer: 1 }
 * ];
 * formatMoveList(path, 8, 3)
 * // returns [
 * //   { moveNumber: 1, from: 'L1:a1', to: 'L1:c2', formatted: '1. L1:a1 → L1:c2' },
 * //   { moveNumber: 2, from: 'L1:c2', to: 'L2:e1', formatted: '2. L1:c2 → L2:e1' }
 * // ]
 */
export function formatMoveList(
  path: Position[],
  boardSize: number,
  totalLayers: number
): ChessMove[] {
  if (!path || path.length < 2) {
    console.debug("formatMoveList: path is empty or has only one position, returning empty list");
    return [];
  }

  const moves: ChessMove[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const moveNumber = i + 1;

    try {
      moves.push(formatMove(moveNumber, from, to, boardSize, totalLayers));
    } catch (error) {
      console.error(`formatMoveList: failed to format move ${moveNumber}:`, error);
      // Continue processing remaining moves even if one fails
    }
  }

  return moves;
}
