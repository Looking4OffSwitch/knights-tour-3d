/**
 * Spatial Partitioning System
 *
 * This module provides a grid-based spatial partitioning system for efficient
 * 2D overlap detection. Instead of checking every square against the knight
 * (O(n) per frame), we use spatial hashing to quickly find candidate squares
 * that might overlap (O(1) average case).
 *
 * The system divides 2D screen space into a grid of cells. Each cell maintains
 * a list of squares whose bounding boxes intersect that cell. To find overlaps,
 * we only need to check squares in cells that the knight's bounding box touches.
 *
 * @module spatialPartition
 */

import {
  type BoundingBox2D,
  type Point2D,
  boundingBoxesOverlap,
} from "./projection3D";

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Represents an item stored in the spatial partition
 */
export interface SpatialItem<T> {
  /** Unique identifier for this item */
  id: string;
  /** 2D bounding box of the item in screen space */
  boundingBox: BoundingBox2D;
  /** The actual data associated with this item */
  data: T;
}

/**
 * Configuration for the spatial partition grid
 */
export interface SpatialPartitionConfig {
  /** Size of each grid cell in pixels */
  cellSize: number;
  /** Minimum X coordinate of the space (default: -2000) */
  minX?: number;
  /** Maximum X coordinate of the space (default: 2000) */
  maxX?: number;
  /** Minimum Y coordinate of the space (default: -2000) */
  minY?: number;
  /** Maximum Y coordinate of the space (default: 2000) */
  maxY?: number;
}

/**
 * Result of a query against the spatial partition
 */
export interface QueryResult<T> {
  /** Items that potentially overlap (need fine-grained check) */
  candidates: SpatialItem<T>[];
  /** Number of cells checked */
  cellsChecked: number;
  /** Total items in those cells (before deduplication) */
  totalItemsChecked: number;
}

// =============================================================================
// Constants
// =============================================================================

/** Default cell size for the spatial grid */
const DEFAULT_CELL_SIZE = 100;

/** Default spatial bounds */
const DEFAULT_MIN_COORD = -2000;
const DEFAULT_MAX_COORD = 2000;

/** Enable debug logging */
const DEBUG_SPATIAL = false;

// =============================================================================
// Spatial Partition Class
// =============================================================================

/**
 * A grid-based spatial partition for efficient 2D overlap queries
 *
 * @typeParam T - Type of data stored with each item
 *
 * @example
 * ```typescript
 * const partition = new SpatialPartition<SquareData>({ cellSize: 50 });
 *
 * // Insert squares
 * partition.insert({
 *   id: "square_0_0_1",
 *   boundingBox: { minX: 0, maxX: 50, minY: 0, maxY: 50 },
 *   data: { boardX: 0, boardY: 0, layer: 1 }
 * });
 *
 * // Query for overlaps
 * const knightBox = { minX: 20, maxX: 40, minY: 20, maxY: 40 };
 * const result = partition.queryOverlapping(knightBox);
 * ```
 */
export class SpatialPartition<T> {
  /** Size of each grid cell in pixels */
  private readonly cellSize: number;

  /** Minimum X coordinate of the space */
  private readonly minX: number;

  /** Maximum X coordinate of the space */
  private readonly maxX: number;

  /** Minimum Y coordinate of the space */
  private readonly minY: number;

  /** Maximum Y coordinate of the space */
  private readonly maxY: number;

  /** Number of cells in the X direction */
  private readonly gridWidth: number;

  /** Number of cells in the Y direction */
  private readonly gridHeight: number;

  /** The grid cells, each containing a Set of item IDs */
  private readonly cells: Map<number, Set<string>>;

  /** Map of item ID to item data */
  private readonly items: Map<string, SpatialItem<T>>;

  /**
   * Creates a new spatial partition
   *
   * @param config - Configuration options
   */
  constructor(config: SpatialPartitionConfig) {
    this.cellSize = config.cellSize || DEFAULT_CELL_SIZE;
    this.minX = config.minX ?? DEFAULT_MIN_COORD;
    this.maxX = config.maxX ?? DEFAULT_MAX_COORD;
    this.minY = config.minY ?? DEFAULT_MIN_COORD;
    this.maxY = config.maxY ?? DEFAULT_MAX_COORD;

    // Validate configuration
    if (this.cellSize <= 0) {
      console.error("SpatialPartition: cellSize must be positive, using default");
      this.cellSize = DEFAULT_CELL_SIZE;
    }

    // Calculate grid dimensions
    this.gridWidth = Math.ceil((this.maxX - this.minX) / this.cellSize);
    this.gridHeight = Math.ceil((this.maxY - this.minY) / this.cellSize);

    // Initialize storage
    this.cells = new Map();
    this.items = new Map();

    if (DEBUG_SPATIAL) {
      console.debug(
        `SpatialPartition created: ${this.gridWidth}x${this.gridHeight} cells, ` +
        `cellSize=${this.cellSize}, bounds=[${this.minX},${this.minY}]-[${this.maxX},${this.maxY}]`
      );
    }
  }

  /**
   * Converts world coordinates to grid cell coordinates
   *
   * @param x - X coordinate in world space
   * @param y - Y coordinate in world space
   * @returns Grid cell coordinates { cellX, cellY }
   */
  private worldToCell(x: number, y: number): { cellX: number; cellY: number } {
    const cellX = Math.floor((x - this.minX) / this.cellSize);
    const cellY = Math.floor((y - this.minY) / this.cellSize);

    // Clamp to grid bounds
    return {
      cellX: Math.max(0, Math.min(cellX, this.gridWidth - 1)),
      cellY: Math.max(0, Math.min(cellY, this.gridHeight - 1)),
    };
  }

  /**
   * Converts cell coordinates to a unique cell index
   *
   * @param cellX - Cell X coordinate
   * @param cellY - Cell Y coordinate
   * @returns Unique cell index
   */
  private cellToIndex(cellX: number, cellY: number): number {
    return cellY * this.gridWidth + cellX;
  }

  /**
   * Gets all cell indices that a bounding box overlaps
   *
   * @param box - Bounding box to check
   * @returns Array of cell indices
   */
  private getCellsForBoundingBox(box: BoundingBox2D): number[] {
    const minCell = this.worldToCell(box.minX, box.minY);
    const maxCell = this.worldToCell(box.maxX, box.maxY);

    const indices: number[] = [];

    for (let cy = minCell.cellY; cy <= maxCell.cellY; cy++) {
      for (let cx = minCell.cellX; cx <= maxCell.cellX; cx++) {
        indices.push(this.cellToIndex(cx, cy));
      }
    }

    return indices;
  }

  /**
   * Inserts an item into the spatial partition
   *
   * The item will be added to all cells that its bounding box overlaps.
   *
   * @param item - Item to insert
   */
  public insert(item: SpatialItem<T>): void {
    // Validate item
    if (!item.id) {
      console.error("SpatialPartition.insert: item must have an id");
      return;
    }

    // Remove existing item with same ID (update case)
    if (this.items.has(item.id)) {
      this.remove(item.id);
    }

    // Store the item
    this.items.set(item.id, item);

    // Add to all overlapping cells
    const cellIndices = this.getCellsForBoundingBox(item.boundingBox);

    for (const index of cellIndices) {
      let cell = this.cells.get(index);
      if (!cell) {
        cell = new Set();
        this.cells.set(index, cell);
      }
      cell.add(item.id);
    }

    if (DEBUG_SPATIAL) {
      console.debug(
        `SpatialPartition.insert: ${item.id} added to ${cellIndices.length} cells`
      );
    }
  }

  /**
   * Removes an item from the spatial partition
   *
   * @param id - ID of the item to remove
   * @returns true if item was found and removed, false otherwise
   */
  public remove(id: string): boolean {
    const item = this.items.get(id);
    if (!item) {
      return false;
    }

    // Remove from all cells
    const cellIndices = this.getCellsForBoundingBox(item.boundingBox);

    for (const index of cellIndices) {
      const cell = this.cells.get(index);
      if (cell) {
        cell.delete(id);
        // Clean up empty cells
        if (cell.size === 0) {
          this.cells.delete(index);
        }
      }
    }

    // Remove from items map
    this.items.delete(id);

    if (DEBUG_SPATIAL) {
      console.debug(`SpatialPartition.remove: ${id} removed`);
    }

    return true;
  }

  /**
   * Clears all items from the spatial partition
   */
  public clear(): void {
    this.cells.clear();
    this.items.clear();

    if (DEBUG_SPATIAL) {
      console.debug("SpatialPartition.clear: all items removed");
    }
  }

  /**
   * Queries for all items that potentially overlap with a bounding box
   *
   * This performs a coarse-grained check using the spatial grid, then
   * a fine-grained bounding box overlap test on candidates.
   *
   * @param queryBox - Bounding box to check for overlaps
   * @param excludeIds - Optional set of item IDs to exclude from results
   * @returns Query result with overlapping items
   */
  public queryOverlapping(
    queryBox: BoundingBox2D,
    excludeIds?: Set<string>
  ): QueryResult<T> {
    const cellIndices = this.getCellsForBoundingBox(queryBox);
    const candidateIds = new Set<string>();
    let totalItemsChecked = 0;

    // Collect all unique item IDs from overlapping cells
    for (const index of cellIndices) {
      const cell = this.cells.get(index);
      if (cell) {
        for (const id of cell) {
          if (!excludeIds?.has(id)) {
            candidateIds.add(id);
          }
          totalItemsChecked++;
        }
      }
    }

    // Fine-grained overlap test
    const candidates: SpatialItem<T>[] = [];

    for (const id of candidateIds) {
      const item = this.items.get(id);
      if (item && boundingBoxesOverlap(queryBox, item.boundingBox)) {
        candidates.push(item);
      }
    }

    if (DEBUG_SPATIAL) {
      console.debug(
        `SpatialPartition.queryOverlapping: checked ${cellIndices.length} cells, ` +
        `${candidateIds.size} unique candidates, ${candidates.length} overlapping`
      );
    }

    return {
      candidates,
      cellsChecked: cellIndices.length,
      totalItemsChecked,
    };
  }

  /**
   * Gets the total number of items in the partition
   *
   * @returns Number of items
   */
  public get size(): number {
    return this.items.size;
  }

  /**
   * Gets the number of non-empty cells in the grid
   *
   * @returns Number of cells with items
   */
  public get activeCellCount(): number {
    return this.cells.size;
  }

  /**
   * Gets statistics about the spatial partition
   *
   * @returns Object with statistics
   */
  public getStats(): {
    itemCount: number;
    activeCellCount: number;
    gridDimensions: { width: number; height: number };
    cellSize: number;
    averageItemsPerCell: number;
  } {
    let totalItemsInCells = 0;
    for (const cell of this.cells.values()) {
      totalItemsInCells += cell.size;
    }

    return {
      itemCount: this.items.size,
      activeCellCount: this.cells.size,
      gridDimensions: { width: this.gridWidth, height: this.gridHeight },
      cellSize: this.cellSize,
      averageItemsPerCell:
        this.cells.size > 0 ? totalItemsInCells / this.cells.size : 0,
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a spatial partition optimized for the Knight's Tour visualization
 *
 * Uses a cell size appropriate for the typical board/square sizes.
 *
 * @param cellSize - Optional custom cell size (default: 100)
 * @returns Configured SpatialPartition instance
 */
export function createOcclusionPartition<T>(
  cellSize: number = 100
): SpatialPartition<T> {
  return new SpatialPartition<T>({
    cellSize,
    minX: -1000,
    maxX: 1000,
    minY: -1000,
    maxY: 1000,
  });
}
