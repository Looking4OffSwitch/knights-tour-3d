/**
 * GradientPreview Component
 *
 * Displays a visual preview of a color gradient
 * Shows the smooth transition between colors
 */

interface GradientPreviewProps {
  /** Array of hex color strings representing the gradient */
  gradient: string[];
  /** Height of the preview bar in pixels */
  height?: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Renders a horizontal bar showing the color gradient
 *
 * Uses CSS linear-gradient to display smooth color transitions.
 * If gradient has many colors, samples a subset for performance.
 */
export function GradientPreview({
  gradient,
  height = 24,
  className = "",
}: GradientPreviewProps) {
  if (!gradient || gradient.length === 0) {
    // Fallback: show gray bar if no gradient provided
    return (
      <div
        className={`w-full rounded border border-border bg-muted ${className}`}
        style={{ height: `${height}px` }}
        role="img"
        aria-label="No gradient available"
      />
    );
  }

  // Create CSS linear-gradient string
  // For performance, limit to a reasonable number of color stops
  const maxStops = 20;
  const step = Math.max(1, Math.floor(gradient.length / maxStops));
  const colorStops = gradient
    .filter((_, index) => index % step === 0 || index === gradient.length - 1)
    .join(", ");

  const gradientStyle = {
    background: `linear-gradient(to right, ${colorStops})`,
    height: `${height}px`,
  };

  return (
    <div
      className={`w-full rounded border border-border shadow-sm ${className}`}
      style={gradientStyle}
      role="img"
      aria-label={`Gradient preview from ${gradient[0]} to ${gradient[gradient.length - 1]}`}
      title={`${gradient.length} color gradient`}
    />
  );
}
