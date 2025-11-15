/**
 * Color gradient utilities for knight's tour visualization
 *
 * Provides functions to generate color gradients for visualizing the knight's path
 * by interpolating between a start and end color across a specified number of steps.
 */

/**
 * Validates if a string is a valid hex color format
 * Accepts both #RGB and #RRGGBB formats
 *
 * @param color - The color string to validate
 * @returns true if valid hex color, false otherwise
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== "string") return false;

  // Remove # if present
  const hex = color.startsWith("#") ? color.slice(1) : color;

  // Valid formats: RGB or RRGGBB
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Normalizes a hex color to #RRGGBB format
 * Converts #RGB to #RRGGBB and ensures # prefix
 *
 * @param color - The color to normalize
 * @returns Normalized hex color in #RRGGBB format
 * @throws Error if color is invalid
 */
export function normalizeHexColor(color: string): string {
  if (!isValidHexColor(color)) {
    throw new Error(`Invalid hex color format: ${color}`);
  }

  const hex = color.startsWith("#") ? color.slice(1) : color;

  // Expand short format #RGB to #RRGGBB
  if (hex.length === 3) {
    const expanded = hex
      .split("")
      .map(char => char + char)
      .join("");
    return `#${expanded}`;
  }

  return `#${hex}`;
}

/**
 * Converts a hex color to RGB components
 *
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns Object with r, g, b components (0-255)
 * @throws Error if hex color is invalid
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(hex);
  const hexValue = normalized.slice(1); // Remove #

  const r = parseInt(hexValue.slice(0, 2), 16);
  const g = parseInt(hexValue.slice(2, 4), 16);
  const b = parseInt(hexValue.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Failed to parse hex color: ${hex}`);
  }

  return { r, g, b };
}

/**
 * Converts RGB components to hex color string
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string in #RRGGBB format
 * @throws Error if RGB values are out of range
 */
export function rgbToHex(r: number, g: number, b: number): string {
  // Validate RGB values
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error(
      `RGB values must be between 0-255. Got: r=${r}, g=${g}, b=${b}`
    );
  }

  // Round and convert to integers
  const rInt = Math.round(r);
  const gInt = Math.round(g);
  const bInt = Math.round(b);

  // Convert to hex with zero padding
  const rHex = rInt.toString(16).padStart(2, "0");
  const gHex = gInt.toString(16).padStart(2, "0");
  const bHex = bInt.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Interpolates between two RGB colors
 *
 * @param color1 - Starting RGB color
 * @param color2 - Ending RGB color
 * @param factor - Interpolation factor (0.0 = color1, 1.0 = color2)
 * @returns Interpolated RGB color
 */
function interpolateRgb(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  factor: number
): { r: number; g: number; b: number } {
  // Clamp factor to [0, 1]
  const t = Math.max(0, Math.min(1, factor));

  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t,
  };
}

/**
 * Generates a gradient of colors between start and end colors
 *
 * This function creates a smooth color transition by interpolating
 * RGB values linearly across the specified number of steps.
 *
 * @param startColor - Starting color in hex format (e.g., "#ff0000")
 * @param endColor - Ending color in hex format (e.g., "#00ff00")
 * @param steps - Number of distinct colors in the gradient (must be >= 1)
 * @returns Array of hex color strings representing the gradient
 * @throws Error if colors are invalid or steps is less than 1
 *
 * @example
 * // Generate red to green gradient with 5 steps
 * const gradient = generateGradient("#ff0000", "#00ff00", 5);
 * // Returns: ["#ff0000", "#bf3f00", "#7f7f00", "#3fbf00", "#00ff00"]
 */
export function generateGradient(
  startColor: string,
  endColor: string,
  steps: number
): string[] {
  // Validate parameters
  if (!isValidHexColor(startColor)) {
    throw new Error(`Invalid start color: ${startColor}`);
  }

  if (!isValidHexColor(endColor)) {
    throw new Error(`Invalid end color: ${endColor}`);
  }

  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error(`Steps must be a positive integer, got: ${steps}`);
  }

  // Handle edge case: single step returns start color
  if (steps === 1) {
    return [normalizeHexColor(startColor)];
  }

  // Convert to RGB for interpolation
  const startRgb = hexToRgb(startColor);
  const endRgb = hexToRgb(endColor);

  // Generate gradient
  const gradient: string[] = [];

  for (let i = 0; i < steps; i++) {
    // Calculate interpolation factor (0.0 at start, 1.0 at end)
    const factor = i / (steps - 1);

    // Interpolate RGB values
    const rgb = interpolateRgb(startRgb, endRgb, factor);

    // Convert back to hex and add to gradient
    gradient.push(rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  return gradient;
}

/**
 * Gets a color from a gradient based on an index
 * Safely handles out-of-bounds indices by clamping to valid range
 *
 * @param gradient - Array of hex color strings
 * @param index - Index of the color to retrieve
 * @param fallback - Fallback color if gradient is empty (default: "#808080")
 * @returns Hex color string at the specified index
 */
export function getGradientColor(
  gradient: string[],
  index: number,
  fallback: string = "#808080"
): string {
  if (!gradient || gradient.length === 0) {
    return fallback;
  }

  // Clamp index to valid range
  const clampedIndex = Math.max(
    0,
    Math.min(gradient.length - 1, Math.floor(index))
  );

  return gradient[clampedIndex];
}
