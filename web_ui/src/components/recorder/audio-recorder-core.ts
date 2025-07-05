import { convertToWav } from "./helpers";

export const RecorderStatus = {
  Idle: "idle",
  RecordingStarted: "recordingStarted",
  RecordingStopped: "recordingStopped",
  PlaybackStarted: "playbackStarted",
  PlaybackPaused: "playbackPaused",
} as const;

export type RecorderStatus =
  (typeof RecorderStatus)[keyof typeof RecorderStatus];

export interface AudioRecorderState {
  status: RecorderStatus;
  startedAt: number;
  endedAt: number | undefined;
  cursorTime: number;
  totalTime: number;
  audioBlob: Blob | null;
  waveformData: number[];
  error: string | null;
}

export type AudioRecorderSubscriber<T = AudioRecorderState> = (
  state: T
) => void;

export type RecordingCompleteCallback = (audioBlob: Blob) => void;
export type RecordingClearedCallback = () => void;

export type AudioRecorderEvent = "recording-complete" | "recording-cleared";

interface AudioRecorderEventMap {
  "recording-complete": RecordingCompleteCallback;
  "recording-cleared": RecordingClearedCallback;
}

type AudioRecorderCallback<T extends AudioRecorderEvent> =
  AudioRecorderEventMap[T];

function getInitialState(): Required<AudioRecorderState> {
  return {
    status: RecorderStatus.Idle,
    startedAt: 0,
    endedAt: undefined,
    cursorTime: 0,
    totalTime: 0,
    audioBlob: null,
    waveformData: [],
    error: null,
  };
}

export class AudioRecorderCore {
  protected mediaRecorder: MediaRecorder | null = null;
  protected audioElement: HTMLAudioElement | null = null;
  protected stream: MediaStream | null = null;
  protected chunks: Blob[] = [];
  protected analyser: AnalyserNode | null = null;
  protected audioContext: AudioContext | null = null;
  protected dataArray!: Uint8Array;

  protected recordingAnimationFrameId: number = 0;
  protected playbackAnimationId: number = 0;

  protected state: AudioRecorderState = getInitialState();

  protected subscribers: Set<AudioRecorderSubscriber<AudioRecorderState>> =
    new Set();
  protected listeners: Map<
    AudioRecorderEvent,
    Set<AudioRecorderCallback<AudioRecorderEvent>>
  > = new Map([
    ["recording-complete", new Set()],
    ["recording-cleared", new Set()],
  ]);

  constructor() {
    this.updateRecordingState = this.updateRecordingState.bind(this);
    this.updatePlaybackState = this.updatePlaybackState.bind(this);
  }

  protected setState(updates: Partial<AudioRecorderState>): void {
    this.state = { ...this.state, ...updates };
    this.subscribers.forEach((callback) => callback(this.state));
  }

  public subscribe<T>(
    selector: (state: AudioRecorderState) => T,
    callback: AudioRecorderSubscriber<T>,
    shouldUpdate?: (prev: T, next: T) => boolean
  ): () => void {
    let lastValue: T = selector(this.state);
    const wrappedCallback: AudioRecorderSubscriber<AudioRecorderState> = (
      newState
    ) => {
      const newComputedValue = selector(newState);
      if (
        typeof shouldUpdate === "function"
          ? shouldUpdate(lastValue, newComputedValue)
          : lastValue !== newComputedValue
      ) {
        lastValue = newComputedValue;
        callback(newComputedValue);
      }
    };

    this.subscribers.add(wrappedCallback);

    callback(selector(this.state));

    return () => {
      this.subscribers.delete(wrappedCallback);
    };
  }

  public on<K extends AudioRecorderEvent>(
    event: K,
    callback: AudioRecorderCallback<K>
  ): () => void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback as AudioRecorderCallback<AudioRecorderEvent>);
    }

    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback as AudioRecorderCallback<AudioRecorderEvent>);
      }
    };
  }

  protected emit<K extends AudioRecorderEvent>(
    event: K,
    ...args: K extends "recording-complete"
      ? [audioBlob: Blob]
      : K extends "recording-cleared"
      ? []
      : never
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        if (event === "recording-complete" && args.length === 1) {
          (callback as RecordingCompleteCallback)(args[0] as Blob);
        } else if (event === "recording-cleared" && args.length === 0) {
          (callback as RecordingClearedCallback)();
        }
      });
    }
  }

  public async recordingStart(): Promise<void> {
    try {
      // Connect the audio pipeline
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.chunks = [];
      this.audioContext = new AudioContext();

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      const destination = this.audioContext.createMediaStreamDestination();
      this.analyser.connect(destination);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = this.handleRecordingComplete.bind(this);
      this.mediaRecorder.start(100);

      // Set initial state
      this.setState({
        status: RecorderStatus.RecordingStarted,
        startedAt: Date.now(),
        waveformData: [],
        error: null,
      });

      // Start recording update loop
      this.recordingAnimationFrameId = requestAnimationFrame(
        this.updateRecordingState
      );
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  public recordingStop(): void {
    if (
      this.mediaRecorder &&
      this.state.status === RecorderStatus.RecordingStarted
    ) {
      this.mediaRecorder.stop();
      cancelAnimationFrame(this.recordingAnimationFrameId);
    }
  }

  protected async handleRecordingComplete(): Promise<void> {
    const audioBlob = new Blob(this.chunks, { type: "audio/webm;codecs=opus" });
    const wavBlob = await convertToWav(audioBlob);
    const endedAt = Date.now();
    const totalTime = (endedAt - this.state.startedAt) / 1000;

    this.setState({
      status: RecorderStatus.RecordingStopped,
      audioBlob: wavBlob,
      totalTime,
      endedAt,
      cursorTime: 0,
    });

    this.emit("recording-complete", wavBlob);

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  public playbackStart(): void {
    if (!this.state.audioBlob) return;

    if (!this.audioElement) {
      const url = URL.createObjectURL(this.state.audioBlob);
      this.audioElement = new Audio(url);
    }

    this.audioElement.play();
    this.setState({ status: RecorderStatus.PlaybackStarted });

    this.audioElement.addEventListener("ended", () => {
      cancelAnimationFrame(this.playbackAnimationId);
      this.setState({
        status: RecorderStatus.PlaybackPaused,
        cursorTime: 0,
      });
    });

    // Start playback update loop
    this.playbackAnimationId = requestAnimationFrame(this.updatePlaybackState);
  }

  public playbackPause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    cancelAnimationFrame(this.playbackAnimationId);
    this.setState({ status: RecorderStatus.PlaybackPaused });
  }

  public seekToTime(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
    this.setState({ cursorTime: time });
  }

  public seekToPosition(position: number): void {
    if (position < 0 || position > 1) {
      throw new Error(
        `Invalid seek position: ${position}. Must be between 0 and 1.`
      );
    }

    const time = position * this.state.totalTime;
    this.seekToTime(time);
  }

  public recordingClear(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    cancelAnimationFrame(this.recordingAnimationFrameId);
    cancelAnimationFrame(this.playbackAnimationId);

    this.setState(getInitialState());

    this.emit("recording-cleared");
  }

  protected updateRecordingState(): void {
    if (!this.analyser || this.state.status !== RecorderStatus.RecordingStarted)
      return;

    this.analyser.getByteTimeDomainData(this.dataArray);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    const normalizedValue = Math.min(1, rms * 5);

    const cursorTime = (Date.now() - this.state.startedAt) / 1000;

    this.setState({
      cursorTime,
      waveformData: [...this.state.waveformData, normalizedValue],
    });

    this.recordingAnimationFrameId = requestAnimationFrame(
      this.updateRecordingState
    );
  }

  protected updatePlaybackState(): void {
    if (
      !this.audioElement ||
      this.audioElement.paused ||
      this.state.status !== RecorderStatus.PlaybackStarted
    ) {
      return;
    }

    this.setState({ cursorTime: this.audioElement.currentTime });

    this.playbackAnimationId = requestAnimationFrame(this.updatePlaybackState);
  }

  public destroy(): void {
    this.recordingClear();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.subscribers.clear();
    this.listeners.forEach((eventSet) => eventSet.clear());
  }
}
