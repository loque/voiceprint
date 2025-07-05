import { useAudioRecorderState } from "./audio-recorder-context";

export function AudioRecorderDebugPanel() {
  const status = useAudioRecorderState((state) => state.status);
  const totalTime = useAudioRecorderState((state) => state.totalTime);
  const cursorTime = useAudioRecorderState((state) => state.cursorTime);
  const waveformData = useAudioRecorderState((state) => state.waveformData);
  const error = useAudioRecorderState((state) => state.error);

  if (!status) {
    return (
      <div className="bg-gray-800 text-white p-4 text-sm font-mono">
        <h3>Debug Panel</h3>
        <p>Waiting for recorder...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-white p-4 text-sm font-mono">
      <h3 className="text-lg mb-2">Debug Panel</h3>
      <div className="space-y-1">
        <div>
          Status: <span className="text-green-400">{status}</span>
        </div>
        <div>
          Waveform Length:{" "}
          <span className="text-blue-400">{waveformData.length}</span>
        </div>
        <div>
          Last Amplitude:{" "}
          <span className="text-yellow-400">
            {waveformData[waveformData.length - 1]?.toFixed(4) || "N/A"}
          </span>
        </div>
        <div>
          Total time:{" "}
          <span className="text-pink-400">{totalTime.toFixed(2)}s</span>
        </div>
        <div>
          Cursor Time:{" "}
          <span className="text-orange-400">{cursorTime.toFixed(2)}s</span>
        </div>
        {error && (
          <div>
            Error: <span className="text-red-400">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
