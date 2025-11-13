import ChessBoard3D from "@/components/ChessBoard3D";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { solveKnightsTour, type Position } from "@/lib/knightsTour";
import { ChevronLeft, ChevronRight, Info, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [layers, setLayers] = useState(3);
  const [boardSize, setBoardSize] = useState(8);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0, layer: 0 });
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [visitedSquares, setVisitedSquares] = useState<Position[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [solution, setSolution] = useState<Position[]>([]);
  const [stats, setStats] = useState({ computationTime: 0, totalMoves: 0, backtracks: 0 });
  const [controlPanelOpen, setControlPanelOpen] = useState(true);
  
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  const totalSquares = boardSize * boardSize * layers;

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

  // Show knight at starting position when not running
  useEffect(() => {
    if (!isPlaying && solution.length === 0) {
      setCurrentPath([startPos]);
      setVisitedSquares([]);
    }
  }, [startPos, isPlaying, solution.length]);

  const knightPosition = currentPath.length > 0 ? currentPath[currentPath.length - 1] : startPos;
  const progress = totalSquares > 0 ? Math.round((visitedSquares.length / totalSquares) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Status and Performance */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Knight's Tour 3D Visualizer</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Watch the knight's tour algorithm solve multi-layered chessboards
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Status */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Progress</span>
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
                    <span className="font-semibold">{stats.computationTime.toFixed(2)} ms</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Moves</span>
                    <span className="font-semibold">{stats.totalMoves}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Backtracks</span>
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
                        The knight's tour is a sequence of moves where a chess knight visits every square
                        exactly once.
                      </p>
                      <p>
                        This visualizer extends the classic problem to 3D by stacking multiple chessboard
                        layers, creating new movement possibilities.
                      </p>
                      <p className="text-xs">
                        <strong>Algorithm:</strong> Backtracking with Warnsdorf's heuristic for optimal
                        performance
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
        <div className="flex-1 flex flex-col">
          <ChessBoard3D
            layers={layers}
            boardSize={boardSize}
            knightPosition={knightPosition}
            visitedSquares={visitedSquares}
            path={currentPath}
            controlButtons={
              <>
                <Button
                  onClick={isPlaying ? () => setIsPaused(!isPaused) : startTour}
                  size="lg"
                  className="w-14 h-14"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button
                  onClick={resetTour}
                  variant="outline"
                  size="lg"
                  className="w-14 h-14"
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </>
            }
          />
        </div>

        {/* Collapse Button - Always Visible */}
        <button
          onClick={() => setControlPanelOpen(!controlPanelOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-l-lg p-2 hover:bg-accent transition-colors shadow-lg"
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
            {/* Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Configuration</CardTitle>
                <CardDescription>Set up the board and starting position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Board Size */}
                <div className="space-y-2">
                  <Label htmlFor="board-size">Board Size</Label>
                  <Select
                    value={boardSize.toString()}
                    onValueChange={(value) => {
                      setBoardSize(parseInt(value));
                      resetTour();
                    }}
                    disabled={isPlaying}
                  >
                    <SelectTrigger id="board-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 × 5</SelectItem>
                      <SelectItem value="8">8 × 8 (Standard)</SelectItem>
                      <SelectItem value="10">10 × 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Layers */}
                <div className="space-y-2">
                  <Label htmlFor="layers">Number of Layers</Label>
                  <Select
                    value={layers.toString()}
                    onValueChange={(value) => {
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
                        onValueChange={(value) =>
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
                        onValueChange={(value) =>
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
                        onValueChange={(value) =>
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

                {/* Animation Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="speed">Animation Speed</Label>
                    <span className="text-xs text-muted-foreground">{speed} steps/s</span>
                  </div>
                  <Slider
                    id="speed"
                    min={1}
                    max={10}
                    step={1}
                    value={[speed]}
                    onValueChange={(value) => setSpeed(value[0])}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Step Controls */}
                {solution.length > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={stepBackward}
                      disabled={currentStep === 0}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={togglePause}
                      disabled={!isPlaying}
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={stepForward}
                      disabled={currentStep >= solution.length - 1}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Main controls moved under Layer 1 board */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
