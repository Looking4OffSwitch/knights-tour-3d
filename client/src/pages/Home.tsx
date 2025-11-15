import ChessBoard3D from "@/components/ChessBoard3D";
import { ColorPicker } from "@/components/ColorPicker";
import { GradientPreview } from "@/components/GradientPreview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { solveKnightsTour, type Position } from "@/lib/knightsTour";
import { generateGradient } from "@/lib/gradientUtils";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// Default view settings
const DEFAULT_ZOOM = 1.2;
const DEFAULT_VERTICAL_SPACING = 190;
const DEFAULT_VERTICAL_OFFSET = 140;
const DEFAULT_KNIGHT_SCALE = 0.8;
const DEFAULT_GRADIENT_START = "#004f44"; // Dark teal
const DEFAULT_GRADIENT_END = "#22a75e"; // Green
const DEFAULT_OCCLUSION_ZONE_RADIUS = 1; // 3x3 grid (radius 1 = 3x3, radius 2 = 5x5, etc.)
const DEFAULT_OCCLUSION_ENABLED = false; // Occlusion system disabled by default

// localStorage helpers
const getStoredNumber = (key: string, defaultValue: number): number => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? parseFloat(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStoredNumber = (key: string, value: number) => {
  try {
    localStorage.setItem(key, value.toString());
  } catch {
    // Ignore storage errors
  }
};

const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === "true" : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStoredBoolean = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, value.toString());
  } catch {
    // Ignore storage errors
  }
};

const getStoredString = (key: string, defaultValue: string): string => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStoredString = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
};

export default function Home() {
  const [layers, setLayers] = useState(3);
  const boardSize = 8; // Fixed board size
  const [startPos, setStartPos] = useState<Position>({ x: 7, y: 7, layer: 0 });
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [visitedSquares, setVisitedSquares] = useState<Position[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [currentStep, setCurrentStep] = useState(0);
  const [solution, setSolution] = useState<Position[]>([]);
  const [stats, setStats] = useState({
    computationTime: 0,
    totalMoves: 0,
    backtracks: 0,
  });
  const [controlPanelOpen, setControlPanelOpen] = useState(true);

  // View controls with localStorage persistence
  const [zoom, setZoom] = useState(() =>
    getStoredNumber("kt3d_zoom", DEFAULT_ZOOM)
  );
  const [verticalSpacing, setVerticalSpacing] = useState(() =>
    getStoredNumber("kt3d_verticalSpacing", DEFAULT_VERTICAL_SPACING)
  );
  const [verticalOffset, setVerticalOffset] = useState(() =>
    getStoredNumber("kt3d_verticalOffset", DEFAULT_VERTICAL_OFFSET)
  );
  const [knightScale, setKnightScale] = useState(() =>
    getStoredNumber("kt3d_knightScale", DEFAULT_KNIGHT_SCALE)
  );
  const [gradientStart, setGradientStart] = useState(() =>
    getStoredString("kt3d_gradientStart", DEFAULT_GRADIENT_START)
  );
  const [gradientEnd, setGradientEnd] = useState(() =>
    getStoredString("kt3d_gradientEnd", DEFAULT_GRADIENT_END)
  );
  const [occlusionZoneRadius, setOcclusionZoneRadius] = useState(() =>
    getStoredNumber("kt3d_occlusionZoneRadius", DEFAULT_OCCLUSION_ZONE_RADIUS)
  );
  const [occlusionEnabled, setOcclusionEnabled] = useState(() =>
    getStoredBoolean("kt3d_occlusionEnabled", DEFAULT_OCCLUSION_ENABLED)
  );

  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  const totalSquares = boardSize * boardSize * layers;

  // Generate gradient preview for UI
  // Shows a preview of the color gradient that will be used for the tour
  const gradientPreview = useMemo(() => {
    try {
      // Generate preview with reasonable number of steps (30 for smooth preview)
      return generateGradient(gradientStart, gradientEnd, 30);
    } catch (error) {
      console.error("Failed to generate gradient preview:", error);
      // Fallback to default colors (#004f44 -> #22a75e)
      return generateGradient(DEFAULT_GRADIENT_START, DEFAULT_GRADIENT_END, 30);
    }
  }, [gradientStart, gradientEnd]);

  const resetTour = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPath([]);
    setVisitedSquares([]);
    setCurrentStep(0);
    setSolution([]);
    setStats({ computationTime: 0, totalMoves: 0, backtracks: 0 });
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const startTour = async () => {
    resetTour();
    setIsPlaying(true);

    const startTime = performance.now();
    const result = solveKnightsTour(boardSize, layers, startPos);
    const endTime = performance.now();

    if (result.solution.length > 0) {
      setSolution(result.solution);
      setStats({
        computationTime: endTime - startTime,
        totalMoves: result.solution.length,
        backtracks: result.backtracks,
      });
      setCurrentStep(0);
    } else {
      setIsPlaying(false);
      alert("No solution found for this configuration!");
    }
  };

  const stepForward = () => {
    if (currentStep < solution.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Persist view controls to localStorage
  useEffect(() => {
    setStoredNumber("kt3d_zoom", zoom);
  }, [zoom]);

  useEffect(() => {
    setStoredNumber("kt3d_verticalSpacing", verticalSpacing);
  }, [verticalSpacing]);

  useEffect(() => {
    setStoredNumber("kt3d_verticalOffset", verticalOffset);
  }, [verticalOffset]);

  useEffect(() => {
    setStoredNumber("kt3d_knightScale", knightScale);
  }, [knightScale]);

  useEffect(() => {
    setStoredString("kt3d_gradientStart", gradientStart);
  }, [gradientStart]);

  useEffect(() => {
    setStoredString("kt3d_gradientEnd", gradientEnd);
  }, [gradientEnd]);

  useEffect(() => {
    setStoredNumber("kt3d_occlusionZoneRadius", occlusionZoneRadius);
  }, [occlusionZoneRadius]);

  useEffect(() => {
    setStoredBoolean("kt3d_occlusionEnabled", occlusionEnabled);
  }, [occlusionEnabled]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || solution.length === 0 || isPaused) return;

    const animate = (timestamp: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;

      const elapsed = timestamp - lastUpdateRef.current;
      const interval = 1000 / speed;

      if (elapsed >= interval) {
        setCurrentStep(prev => {
          if (prev >= solution.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        lastUpdateRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isPaused, speed, solution.length]);

  // Update path when step changes
  useEffect(() => {
    if (solution.length > 0) {
      const pathSoFar = solution.slice(0, currentStep + 1);
      setCurrentPath(pathSoFar);
      setVisitedSquares(pathSoFar);
    }
  }, [currentStep, solution]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/select/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        // Toggle play/pause
        if (isPlaying) {
          togglePause();
        } else {
          startTour();
        }
      } else if (e.code === "Enter") {
        e.preventDefault();
        resetTour();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setSpeed(prev => Math.min(10, prev + 1));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setSpeed(prev => Math.max(1, prev - 1));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        // If tour is running, pause it first
        if (isPlaying && !isPaused) {
          setIsPaused(true);
        }
        // Step backward if we have a solution
        if (solution.length > 0) {
          stepBackward();
        }
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        // If tour is running, pause it first
        if (isPlaying && !isPaused) {
          setIsPaused(true);
        }
        // Step forward if we have a solution
        if (solution.length > 0) {
          stepForward();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isPaused, solution.length]);

  // Show knight at starting position when not running
  useEffect(() => {
    if (!isPlaying && solution.length === 0) {
      setCurrentPath([startPos]);
      setVisitedSquares([]);
    }
  }, [startPos, isPlaying, solution.length]);

  const knightPosition =
    currentPath.length > 0 ? currentPath[currentPath.length - 1] : startPos;
  const progress =
    totalSquares > 0
      ? Math.round((visitedSquares.length / totalSquares) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Status and Performance */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Knight's Tour 3D Visualizer
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Watch the knight's tour algorithm solve multi-layered
                chessboards
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* Status */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">
                    Progress
                  </span>
                  <span className="font-semibold">
                    {visitedSquares.length} / {totalSquares} ({progress}%)
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="font-semibold">
                    {isPlaying ? (isPaused ? "Paused" : "Running") : "Ready"}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Layers</span>
                  <span className="font-semibold">{layers}</span>
                </div>
              </div>

              {/* Performance Stats */}
              {stats.totalMoves > 0 && (
                <div className="flex items-center gap-4 text-sm border-l pl-6">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Time</span>
                    <span className="font-semibold">
                      {stats.computationTime.toFixed(2)} ms
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Moves</span>
                    <span className="font-semibold">{stats.totalMoves}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">
                      Backtracks
                    </span>
                    <span className="font-semibold">{stats.backtracks}</span>
                  </div>
                </div>
              )}

              {/* Info Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>About Knight's Tour</DialogTitle>
                    <DialogDescription className="space-y-3 pt-4">
                      <p>
                        The knight's tour is a sequence of moves where a chess
                        knight visits every square exactly once.
                      </p>
                      <p>
                        This visualizer extends the classic problem to 3D by
                        stacking multiple chessboard layers, creating new
                        movement possibilities.
                      </p>
                      <p className="text-xs">
                        <strong>Algorithm:</strong> Backtracking with
                        Warnsdorf's heuristic for optimal performance
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Visualization Pane */}
        <div className="flex-1 flex flex-col relative">
          <ChessBoard3D
            layers={layers}
            boardSize={boardSize}
            knightPosition={knightPosition}
            visitedSquares={visitedSquares}
            path={currentPath}
            zoom={zoom}
            verticalSpacing={verticalSpacing}
            verticalOffset={verticalOffset}
            knightScale={knightScale}
            gradientStart={gradientStart}
            gradientEnd={gradientEnd}
            occlusionZoneRadius={occlusionZoneRadius}
            occlusionEnabled={occlusionEnabled}
          />
        </div>

        {/* Collapse Button - Always Visible */}
        <button
          onClick={() => setControlPanelOpen(!controlPanelOpen)}
          className="fixed top-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-l-lg p-2 hover:bg-accent transition-colors shadow-lg"
          style={{ right: controlPanelOpen ? "384px" : "0" }}
        >
          {controlPanelOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Control Panel */}
        <div
          className={`${
            controlPanelOpen ? "w-96" : "w-0"
          } transition-all duration-300 border-l border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col`}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Controls */}
            <Card>
              <CardHeader className="pb-0 text-center">
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <Separator className="-mt-8 mb-2" />

                {/* Zoom */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="zoom">Zoom</Label>
                    <span className="text-xs text-muted-foreground">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    id="zoom"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={[zoom]}
                    onValueChange={value => setZoom(value[0])}
                    onKeyDown={e => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                {/* Vertical Spacing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="vertical-spacing">Vertical Spacing</Label>
                    <span className="text-xs text-muted-foreground">
                      {verticalSpacing}px
                    </span>
                  </div>
                  <Slider
                    id="vertical-spacing"
                    min={80}
                    max={250}
                    step={10}
                    value={[verticalSpacing]}
                    onValueChange={value => setVerticalSpacing(value[0])}
                    onKeyDown={e => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                {/* Vertical Position */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="vertical-position">Vertical Position</Label>
                    <span className="text-xs text-muted-foreground">
                      {verticalOffset}px
                    </span>
                  </div>
                  <Slider
                    id="vertical-position"
                    min={-100}
                    max={300}
                    step={10}
                    value={[verticalOffset]}
                    onValueChange={value => setVerticalOffset(value[0])}
                    onKeyDown={e => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                <Separator />

                {/* Animation Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="speed">Animation Speed</Label>
                    <span className="text-xs text-muted-foreground">
                      {speed} steps/s
                    </span>
                  </div>
                  <Slider
                    id="speed"
                    min={1}
                    max={10}
                    step={1}
                    value={[speed]}
                    onValueChange={value => setSpeed(value[0])}
                    onKeyDown={e => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="space-y-2">
                  <Label>Tour Controls</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={
                        isPlaying ? () => setIsPaused(!isPaused) : startTour
                      }
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md inline-flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-5 w-5" />
                          {isPaused ? "Resume" : "Pause"}
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Start
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetTour}
                      className="h-12 px-4 border border-border bg-transparent hover:bg-accent rounded-md inline-flex items-center justify-center transition-colors"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Manual Step Controls - always visible when solution exists */}
                  {solution.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Step {currentStep + 1} of {solution.length}
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={stepBackward}
                          disabled={
                            currentStep === 0 || (isPlaying && !isPaused)
                          }
                          className="flex-1 h-10 border border-border bg-transparent hover:bg-accent rounded-md inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Previous step"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="text-sm">Previous</span>
                        </button>
                        <button
                          onClick={stepForward}
                          disabled={
                            currentStep >= solution.length - 1 ||
                            (isPlaying && !isPaused)
                          }
                          className="flex-1 h-10 border border-border bg-transparent hover:bg-accent rounded-md inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Next step"
                        >
                          <span className="text-sm">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setZoom(DEFAULT_ZOOM);
                    setVerticalSpacing(DEFAULT_VERTICAL_SPACING);
                    setVerticalOffset(DEFAULT_VERTICAL_OFFSET);
                    setKnightScale(DEFAULT_KNIGHT_SCALE);
                    setGradientStart(DEFAULT_GRADIENT_START);
                    setGradientEnd(DEFAULT_GRADIENT_END);
                    setOcclusionZoneRadius(DEFAULT_OCCLUSION_ZONE_RADIUS);
                    setOcclusionEnabled(DEFAULT_OCCLUSION_ENABLED);
                  }}
                >
                  Reset to Defaults
                </Button>

                <Separator />

                {/* Layers */}
                <div className="space-y-2">
                  <Label htmlFor="layers">Number of Layers</Label>
                  <Select
                    value={layers.toString()}
                    onValueChange={value => {
                      setLayers(parseInt(value));
                      resetTour();
                    }}
                    disabled={isPlaying}
                  >
                    <SelectTrigger id="layers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Layer (2D)</SelectItem>
                      <SelectItem value="2">2 Layers</SelectItem>
                      <SelectItem value="3">3 Layers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Starting Position */}
                <div className="space-y-2">
                  <Label>Starting Position</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="start-x" className="text-xs">
                        X
                      </Label>
                      <Select
                        value={startPos.x.toString()}
                        onValueChange={value =>
                          setStartPos({ ...startPos, x: parseInt(value) })
                        }
                        disabled={isPlaying}
                      >
                        <SelectTrigger id="start-x">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: boardSize }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="start-y" className="text-xs">
                        Y
                      </Label>
                      <Select
                        value={startPos.y.toString()}
                        onValueChange={value =>
                          setStartPos({ ...startPos, y: parseInt(value) })
                        }
                        disabled={isPlaying}
                      >
                        <SelectTrigger id="start-y">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: boardSize }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="start-layer" className="text-xs">
                        Layer
                      </Label>
                      <Select
                        value={startPos.layer.toString()}
                        onValueChange={value =>
                          setStartPos({ ...startPos, layer: parseInt(value) })
                        }
                        disabled={isPlaying}
                      >
                        <SelectTrigger id="start-layer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: layers }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Knight Scale */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="knight-scale">Knight Scale</Label>
                    <span className="text-sm text-muted-foreground">
                      {knightScale.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    id="knight-scale"
                    min={0.5}
                    max={5}
                    step={0.1}
                    value={[knightScale]}
                    onValueChange={([value]) => setKnightScale(value)}
                  />
                </div>

                {/* Tour Colors */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tour Colors</Label>

                  {/* Gradient Preview */}
                  <GradientPreview
                    gradient={gradientPreview}
                    height={32}
                    className="mb-2"
                  />

                  {/* Start Color Picker */}
                  <ColorPicker
                    label="Gradient Start"
                    value={gradientStart}
                    onChange={setGradientStart}
                    id="gradient-start"
                  />

                  {/* End Color Picker */}
                  <ColorPicker
                    label="Gradient End"
                    value={gradientEnd}
                    onChange={setGradientEnd}
                    id="gradient-end"
                  />
                </div>

                {/* Occlusion System */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="occlusion-enabled" className="text-sm">
                      Knight Visibility System
                    </Label>
                    <Switch
                      id="occlusion-enabled"
                      checked={occlusionEnabled}
                      onCheckedChange={setOcclusionEnabled}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Makes squares transparent when the knight is hidden behind
                    upper layers.
                  </p>

                  {/* Occlusion Zone Size - only show when enabled */}
                  {occlusionEnabled && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="occlusion-zone" className="text-xs">
                          Zone Size
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {occlusionZoneRadius === 0 && "1×1"}
                          {occlusionZoneRadius === 1 && "3×3"}
                          {occlusionZoneRadius === 2 && "5×5"}
                          {occlusionZoneRadius === 3 && "7×7"}
                          {occlusionZoneRadius === 4 && "9×9"}
                        </span>
                      </div>
                      <Slider
                        id="occlusion-zone"
                        min={0}
                        max={4}
                        step={1}
                        value={[occlusionZoneRadius]}
                        onValueChange={([value]) =>
                          setOcclusionZoneRadius(value)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Size of transparent area above knight. Larger values
                        make it easier to see the knight.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Version Display - Fixed at bottom of Controls pane */}
          <div className="border-t border-border/50 py-3 px-4 text-center bg-card/50">
            <span className="text-xs text-muted-foreground">
              v{__APP_VERSION__}
            </span>
          </div>
        </div>

        {/* Keyboard Controls Overlay - Fixed to bottom of viewport */}
        <div className="fixed bottom-6 left-6 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg z-40">
          <h3 className="text-sm font-semibold mb-3 text-foreground">
            Keyboard Controls
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded min-w-[60px] text-center">
                Space
              </kbd>
              <span className="text-xs text-muted-foreground">
                {isPlaying ? "Pause/Resume" : "Start Tour"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded min-w-[60px] text-center">
                Enter
              </kbd>
              <span className="text-xs text-muted-foreground">Reset Tour</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded min-w-[60px] text-center">
                ↑ ↓
              </kbd>
              <span className="text-xs text-muted-foreground">
                Adjust Speed ({speed} steps/s)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded min-w-[60px] text-center">
                ← →
              </kbd>
              <span className="text-xs text-muted-foreground">
                Step Through Tour
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
