import { cn } from "@/lib/utils";
import { useOnRecorderEvent } from "../recorder/audio-recorder-context";
import { RecorderControls } from "../recorder/components";
import { WaveformDisplay } from "../recorder/waveform-display";

type VoiceSampleRecorderProps = {
  onChange?: (audioBlob: Blob | null) => void;
  className?: string;
};

export function VoiceSampleRecorder({
  onChange = () => {},
  className,
}: VoiceSampleRecorderProps) {
  useOnRecorderEvent("recording-complete", onChange);
  useOnRecorderEvent("recording-cleared", () => onChange(null));

  return (
    <div
      className={cn(
        "w-full flex flex-col bg-slate-800 border border-slate-600 rounded",
        className
      )}
    >
      <WaveformDisplay className="flex-1 h-20" />
      <RecorderControls />
    </div>
  );
}
