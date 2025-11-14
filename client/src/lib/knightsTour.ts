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

// Knight moves between layers (2D move + layer change)
const MOVES_3D = [
  // Move within same layer
  ...MOVES_2D.map(([dx, dy]) => [dx, dy, 0]),
  // Move to adjacent layers with smaller 2D displacement
  [1, 0, 1],
  [1, 0, -1],
  [-1, 0, 1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, 1, -1],
  [0, -1, 1],
  [0, -1, -1],
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
  [-1, 1, 1],
  [-1, 1, -1],
  [-1, -1, 1],
  [-1, -1, -1],
];

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
