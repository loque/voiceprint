import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mic,
  Square,
  Play,
  Trash2,
  Download,
  Pause,
  RotateCcw,
} from "lucide-react";
import {
  useAudioRecorder,
  useAudioRecorderState,
} from "./audio-recorder-context";
import { RecorderStatus } from "./audio-recorder-core";
import { downloadAudio, secondsToTime } from "./helpers";

export function RecorderControls() {
  const status = useAudioRecorderState((state) => state.status);

  const recordingTime = useAudioRecorderState((state) =>
    secondsToTime(state.cursorTime)
  );

  const playbackTime = useAudioRecorderState(
    (state) => {
      if (state.totalTime <= 0) return null;

      const currentTime = secondsToTime(state.cursorTime);
      const totalTime = secondsToTime(state.totalTime);

      return [currentTime, totalTime];
    },
    (prev, next) => {
      if (!prev || !next) return false;
      return prev[0] !== next[0] || prev[1] !== next[1];
    }
  );

  const audioBlob = useAudioRecorderState((state) => state.audioBlob);
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="flex justify-center">
        {status === RecorderStatus.Idle && <RecordStartButton />}
        {status === RecorderStatus.RecordingStarted && <RecordStopButton />}
        {[
          RecorderStatus.RecordingStopped,
          RecorderStatus.PlaybackPaused,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
        ].includes(status) && <PlaybackStartButton />}
        {status === RecorderStatus.PlaybackStarted && <PlaybackPauseButton />}
        {[
          RecorderStatus.RecordingStopped,
          RecorderStatus.PlaybackPaused,
          RecorderStatus.PlaybackStarted,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
        ].includes(status) && <PlaybackRewindButton />}
        <div className="flex items-center pl-4 text-sm text-gray-400">
          {playbackTime && status !== RecorderStatus.Idle && (
            <div className="flex items-center gap-1 ">
              <span>{playbackTime[0]}</span>
              <span>/</span>
              <span>{playbackTime[1]}</span>
            </div>
          )}
          {status === RecorderStatus.RecordingStarted && (
            <span>{recordingTime}</span>
          )}
        </div>
      </div>
      <div>
        {[
          RecorderStatus.RecordingStopped,
          RecorderStatus.PlaybackPaused,
          RecorderStatus.PlaybackStarted,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
        ].includes(status) && (
          <RecordingDownloadButton onClick={() => downloadAudio(audioBlob)} />
        )}
        {[
          RecorderStatus.RecordingStopped,
          RecorderStatus.PlaybackPaused,
          RecorderStatus.PlaybackStarted,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
        ].includes(status) && <RecordingClearButton />}
      </div>
    </div>
  );
}

export function RecordStartButton({ className, ...props }: ButtonProps) {
  const { recorder } = useAudioRecorder();
  return (
    <Button
      onClick={() => recorder.recordingStart()}
      variant={"ghost"}
      color={"destructive"}
      className={cn("rounded-full", className)}
      {...props}
    >
      <Mic className="" /> Record
    </Button>
  );
}

export function RecordStopButton({ className, ...props }: ButtonProps) {
  const { recorder } = useAudioRecorder();
  return (
    <Button
      onClick={() => recorder.recordingStop()}
      variant={"solid"}
      color={"destructive"}
      size="icon"
      className={cn("rounded-full", className)}
      {...props}
    >
      <Square />
    </Button>
  );
}

function PlaybackRewindButton({ className, ...props }: ButtonProps) {
  const { recorder } = useAudioRecorder();
  return (
    <Button
      onClick={() => recorder.seekToPosition(0)}
      variant={"ghost"}
      size="icon"
      className={cn("rounded-full", className)}
      {...props}
    >
      <RotateCcw />
    </Button>
  );
}

function PlaybackStartButton({ className, ...props }: ButtonProps) {
  const { recorder } = useAudioRecorder();
  return (
    <Button
      onClick={() => recorder.playbackStart()}
      variant={"ghost"}
      size="icon"
      className={cn("rounded-full", className)}
      {...props}
    >
      <Play />
    </Button>
  );
}

function PlaybackPauseButton({ className, ...props }: ButtonProps) {
  const { recorder } = useAudioRecorder();
  return (
    <Button
      onClick={() => recorder.playbackPause()}
      variant={"ghost"}
      size="icon"
      className={cn("rounded-full", className)}
      {...props}
    >
      <Pause />
    </Button>
  );
}

function RecordingClearButton({ className, ...props }: ButtonProps) {
  const { recorder } = useAudioRecorder();
  return (
    <Button
      onClick={() => recorder.recordingClear()}
      variant="ghost"
      color="destructive"
      size="icon"
      className={cn("rounded-full", className)}
      {...props}
    >
      <Trash2 />
    </Button>
  );
}

export function RecordingDownloadButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      {...props}
    >
      <Download />
    </Button>
  );
}
