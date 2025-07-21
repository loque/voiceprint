import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAudioRecorder } from "./audio-recorder-context";
import { WaveformCanvas } from "./waveform-canvas";

interface WaveformDisplayProps {
  className?: string;
}

export function WaveformDisplay({ className }: WaveformDisplayProps) {
  const { recorder } = useAudioRecorder();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const waveformCanvas = new WaveformCanvas(canvas);
    const disconnect = waveformCanvas.connect(recorder);

    return disconnect;
  }, [recorder]);

  return (
    <div className={cn("relative w-full h-20", className)}>
      <canvas ref={canvasRef} className="w-full h-20 cursor-pointer" />
    </div>
  );
}
