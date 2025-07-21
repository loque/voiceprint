import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
  useState,
  type PropsWithChildren,
  useRef,
} from "react";
import {
  AudioRecorderCore,
  type AudioRecorderEvent,
  type AudioRecorderState,
  type RecordingCompleteCallback,
} from "./audio-recorder-core";

interface AudioRecorderContextValue {
  recorder: AudioRecorderCore;
}

const AudioRecorderContext = createContext<AudioRecorderContextValue | null>(
  null
);

function AudioRecorderProvider({ children }: PropsWithChildren) {
  const recorder = useMemo(() => new AudioRecorderCore(), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recorder.destroy();
    };
  }, [recorder]);

  return (
    <AudioRecorderContext.Provider value={{ recorder }}>
      {children}
    </AudioRecorderContext.Provider>
  );
}

interface AudioRecorderProps {
  children: ReactNode;
}

export function AudioRecorder({ children }: AudioRecorderProps) {
  return <AudioRecorderProvider>{children}</AudioRecorderProvider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioRecorder(): AudioRecorderContextValue {
  const context = useContext(AudioRecorderContext);
  if (!context) {
    throw new Error(
      "useAudioRecorder must be used within AudioRecorderProvider"
    );
  }
  return context;
}

// Custom hook for subscribing to specific state properties
// eslint-disable-next-line react-refresh/only-export-components
export function useAudioRecorderState<T>(
  selector: (state: AudioRecorderState) => T,
  shouldUpdate?: (prev: T, next: T) => boolean
): T {
  const { recorder } = useAudioRecorder();
  const selectorRef = useRef(selector);
  const shouldUpdateRef = useRef(shouldUpdate);

  // Update refs on each render
  selectorRef.current = selector;
  shouldUpdateRef.current = shouldUpdate;

  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    const stableSelector = (state: AudioRecorderState) =>
      selectorRef.current(state);
    const stableShouldUpdate = shouldUpdateRef.current
      ? (prev: T, next: T) => shouldUpdateRef.current!(prev, next)
      : undefined;

    const unsubscribe = recorder.subscribe(
      stableSelector,
      setValue,
      stableShouldUpdate
    );
    return unsubscribe;
  }, [recorder]);

  return value as T;
}

// Custom hook for subscribing to recording completion
// eslint-disable-next-line react-refresh/only-export-components
export function useOnRecorderEvent(
  event: AudioRecorderEvent,
  callback: RecordingCompleteCallback
): void {
  const { recorder } = useAudioRecorder();

  useEffect(() => {
    const unsubscribe = recorder.on(event, callback);
    return unsubscribe;
  }, [recorder, event, callback]);
}
