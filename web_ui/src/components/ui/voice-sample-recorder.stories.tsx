import React from "react";
import { VoiceSampleRecorder } from "./voice-sample-recorder";
import type { StoryConfig } from "@/stories/types";
import { AudioRecorder } from "../recorder/audio-recorder-context";
import { AudioRecorderDebugPanel } from "../recorder/audio-recorder-debug-panel";

export const config: StoryConfig = {
  name: "Voice Sample Recorder",
};

export function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="w-8/12 mx-auto px-4 py-10">{children}</div>;
}

export function One() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Voice Sample Recorder</h2>
      <AudioRecorder>
        <VoiceSampleRecorder />
        <AudioRecorderDebugPanel />
      </AudioRecorder>
    </div>
  );
}

export function Multiple() {
  const [recordings, setRecordings] = React.useState<{
    recorder1: Blob | null;
    recorder2: Blob | null;
    recorder3: Blob | null;
  }>({
    recorder1: null,
    recorder2: null,
    recorder3: null,
  });

  const updateRecording =
    (recorderId: keyof typeof recordings) => (audioBlob: Blob | null) => {
      setRecordings((prev) => ({
        ...prev,
        [recorderId]: audioBlob,
      }));
    };

  const getRecordingStatus = (blob: Blob | null) => {
    if (!blob) return { text: "No recording", color: "text-gray-500" };
    return {
      text: `Recorded (${(blob.size / 1024).toFixed(1)}KB)`,
      color: "text-green-500",
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Multiple Voice Sample Recorders</h2>

      {/* Results Summary */}
      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Recording Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(recordings).map(([key, blob], index) => {
            const status = getRecordingStatus(blob);
            return (
              <div key={key} className="flex flex-col items-start gap-2">
                <span className="font-medium">Recorder {index + 1}</span>
                <span className={status.color}>{status.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recorders */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h4 className="font-medium">Recorder 1</h4>
          <AudioRecorder>
            <VoiceSampleRecorder onChange={updateRecording("recorder1")} />
          </AudioRecorder>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-medium">Recorder 2</h4>
          <AudioRecorder>
            <VoiceSampleRecorder onChange={updateRecording("recorder2")} />
          </AudioRecorder>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-medium">Recorder 3</h4>
          <AudioRecorder>
            <VoiceSampleRecorder onChange={updateRecording("recorder3")} />
          </AudioRecorder>
        </div>
      </div>
    </div>
  );
}
