/**
 * ColorPicker Component
 *
 * Provides a user-friendly interface for selecting colors with:
 * - Native HTML color picker for visual selection
 * - Text input for manual hex color entry
 * - Color swatch preview
 * - Validation and error handling
 */

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidHexColor, normalizeHexColor } from "@/lib/gradientUtils";

interface ColorPickerProps {
  /** Label text displayed above the color picker */
  label: string;
  /** Current color value in hex format */
  value: string;
  /** Callback invoked when color changes (always receives normalized #RRGGBB format) */
  onChange: (color: string) => void;
  /** HTML id for the input elements (auto-generated if not provided) */
  id?: string;
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * ColorPicker component for selecting colors via native picker or hex input
 *
 * Ensures all color values are validated and normalized to #RRGGBB format.
 * Invalid colors are reverted to the last valid value.
 */
export function ColorPicker({
  label,
  value,
  onChange,
  id,
  className = "",
}: ColorPickerProps) {
  // Generate unique ID if not provided
  const inputId =
    id || `color-picker-${label.toLowerCase().replace(/\s+/g, "-")}`;

  // Local state for hex input to allow typing without immediate validation
  const [hexInput, setHexInput] = useState<string>("");
  const [isInvalid, setIsInvalid] = useState<boolean>(false);

  // Initialize hex input from value prop
  useEffect(() => {
    try {
      const normalized = normalizeHexColor(value);
      setHexInput(normalized);
      setIsInvalid(false);
    } catch (error) {
      // If value prop is invalid, show it in input for user to fix
      setHexInput(value);
      setIsInvalid(true);
    }
  }, [value]);

  /**
   * Handles native color picker changes
   * Native input always provides valid #RRGGBB format
   */
  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setHexInput(newColor);
      setIsInvalid(false);
      onChange(newColor);
    },
    [onChange]
  );

  /**
   * Handles text input changes
   * Validates on blur to allow user to finish typing
   */
  const handleHexInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.trim();
      setHexInput(newValue);

      // Check if it's potentially valid (allow in-progress typing)
      const couldBeValid = /^#?[0-9A-Fa-f]{0,6}$/.test(newValue);
      setIsInvalid(!couldBeValid && newValue !== "");
    },
    []
  );

  /**
   * Validates and commits hex input value on blur
   * Reverts to previous valid value if invalid
   */
  const handleHexInputBlur = useCallback(() => {
    if (!hexInput) {
      // Empty input - revert to current value
      setHexInput(value);
      setIsInvalid(false);
      return;
    }

    if (isValidHexColor(hexInput)) {
      try {
        const normalized = normalizeHexColor(hexInput);
        setHexInput(normalized);
        setIsInvalid(false);
        onChange(normalized);
      } catch (error) {
        console.error("Failed to normalize color:", error);
        setHexInput(value);
        setIsInvalid(false);
      }
    } else {
      // Invalid format - revert to previous valid value
      setHexInput(value);
      setIsInvalid(false);
    }
  }, [hexInput, value, onChange]);

  /**
   * Handles Enter key in hex input to commit immediately
   */
  const handleHexInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur(); // Trigger blur validation
      }
    },
    []
  );

  // Normalize current value for color picker (fallback to white if invalid)
  let colorPickerValue = "#ffffff";
  try {
    colorPickerValue = normalizeHexColor(value);
  } catch (error) {
    // Use fallback color
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <Label htmlFor={inputId}>{label}</Label>

      <div className="flex gap-2 items-center">
        {/* Color Swatch & Native Picker */}
        <div className="relative flex-shrink-0">
          <input
            type="color"
            id={inputId}
            value={colorPickerValue}
            onChange={handleColorPickerChange}
            className="w-12 h-10 rounded border-2 border-border cursor-pointer"
            aria-label={`${label} color picker`}
            title="Click to open color picker"
          />
        </div>

        {/* Hex Input */}
        <Input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          onKeyDown={handleHexInputKeyDown}
          placeholder="#RRGGBB"
          maxLength={7}
          className={`font-mono text-sm ${isInvalid ? "border-red-500 focus:ring-red-500" : ""}`}
          aria-label={`${label} hex color value`}
          aria-invalid={isInvalid}
        />
      </div>

      {/* Error Message */}
      {isInvalid && (
        <p className="text-xs text-red-500" role="alert">
          Invalid hex color format. Use #RGB or #RRGGBB
        </p>
      )}
    </div>
  );
}
