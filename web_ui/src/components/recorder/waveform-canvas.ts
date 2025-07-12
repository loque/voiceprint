import type {
  AudioRecorderCore,
  AudioRecorderState,
} from "./audio-recorder-core";
import { RecorderStatus } from "./audio-recorder-core";

export class WaveformCanvas {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected rect: DOMRect | null = null;
  protected seekToPosition?: (position: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Canvas element is required");
    }

    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not supported");
    this.ctx = ctx;
  }

  public connect(recorder: AudioRecorderCore): () => void {
    if (!this.canvas.parentElement) {
      throw new Error(
        "WaveformCanvas: canvas must be attached to the DOM before connecting."
      );
    }

    // Initialize canvas size immediately
    this.updateCanvasSize();

    let currentState: AudioRecorderState | undefined;

    // Resize the canvas when its parent element changes size
    let resizePending = false;
    const ro = new ResizeObserver(() => {
      if (resizePending) return;
      resizePending = true;
      // Use rAF to avoid layout thrashing and ensure the canvas
      // size is updated after the DOM has settled
      requestAnimationFrame(() => {
        this.updateCanvasSize();
        if (currentState) this.render(currentState);
        resizePending = false;
      });
    });
    ro.observe(this.canvas);

    // Subscribe to recorder state changes
    const unsubscribe = recorder.subscribe(
      (state) => state,
      (state: AudioRecorderState) => {
        currentState = state;
        this.render(state);
      }
    );

    // Setup canvas click handler
    const clickHandler = this.handleClick.bind(this);
    this.canvas.addEventListener("click", clickHandler);

    // Store a reference to the seek function
    this.seekToPosition = recorder.seekToPosition.bind(recorder);

    return () => {
      unsubscribe();
      ro.disconnect();
      this.canvas.removeEventListener("click", clickHandler);
    };
  }

  protected updateCanvasSize(): void {
    this.rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size to match the bounding rect, scaled by device pixel ratio
    this.canvas.width = this.rect.width * dpr;
    this.canvas.height = this.rect.height * dpr;

    // Reset transformation matrix and scale context for high DPI
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  protected render(state: AudioRecorderState): void {
    if (!this.rect) {
      this.updateCanvasSize();
      if (!this.rect) {
        console.error("WaveformCanvas: Canvas size not set.");
        return;
      }
    }
    this.ctx.clearRect(0, 0, this.rect.width, this.rect.height);

    if (!state.waveformData?.length) {
      this.renderPlaceholder(this.rect, state);
      return;
    }

    this.renderWaveform(this.rect, state);
  }

  protected renderPlaceholder(rect: DOMRect, state: AudioRecorderState): void {
    // Dotted line placeholder
    this.ctx.strokeStyle = "#374151";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, rect.height / 2);
    this.ctx.lineTo(rect.width, rect.height / 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Playback position line
    if (
      state.status !== RecorderStatus.RecordingStarted &&
      state.totalTime > 0
    ) {
      const playbackX = (state.cursorTime / state.totalTime) * rect.width;
      this.ctx.strokeStyle = "#3b82f6";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(playbackX, 0);
      this.ctx.lineTo(playbackX, rect.height);
      this.ctx.stroke();
    }
  }

  protected renderWaveform(rect: DOMRect, state: AudioRecorderState): void {
    const { waveformData, status, cursorTime, totalTime } = state;

    let barWidth: number;
    let barAndGapWidth: number;
    let barsToRender: number;

    if (status === RecorderStatus.RecordingStarted) {
      // During recording, use fixed bar width and gap, limit to what fits
      const fixedBarWidth = 2;
      const fixedGap = 1;
      const fixedBarAndGapWidth = fixedBarWidth + fixedGap;
      const maxBars = Math.floor(rect.width / fixedBarAndGapWidth);
      barsToRender = Math.min(waveformData.length, maxBars);
      barAndGapWidth = fixedBarAndGapWidth;
      barWidth = fixedBarWidth;
    } else {
      // When not recording, shrink/expand bars to exactly fill container width
      barsToRender = waveformData.length;
      barAndGapWidth = rect.width / barsToRender;
      barWidth = barAndGapWidth;
    }

    const adjustedData = waveformData.slice(-barsToRender);

    const playedBars =
      totalTime > 0 ? Math.floor((cursorTime / totalTime) * barsToRender) : 0;

    // Draw waveform bars
    for (let i = 0; i < barsToRender; i++) {
      const x = i * barAndGapWidth;
      const amplitude = adjustedData[i] || 0;
      const barHeight = Math.max(2, amplitude * (rect.height * 0.8));
      const y = (rect.height - barHeight) / 2;

      // Color based on status and playback position
      if (status === RecorderStatus.PlaybackStarted && i < playedBars) {
        this.ctx.fillStyle = "#10b981"; // Green for playing
      } else if (status === RecorderStatus.RecordingStarted) {
        this.ctx.fillStyle = "#ef4444"; // Red for recording
      } else if (
        status === RecorderStatus.RecordingStopped ||
        status === RecorderStatus.PlaybackPaused
      ) {
        this.ctx.fillStyle = "#3b82f6"; // Blue for available
      } else {
        this.ctx.fillStyle = "#6b7280"; // Gray for idle
      }

      this.ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Draw playback position line
    if (totalTime > 0) {
      const cursorXPos = (cursorTime / totalTime) * rect.width;
      this.ctx.strokeStyle = "#3b82f6";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(cursorXPos, 0);
      this.ctx.lineTo(cursorXPos, rect.height);
      this.ctx.stroke();
    }
  }

  protected handleClick(event: MouseEvent): void {
    if (!this.seekToPosition) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Pass ratio to the seek handler
    this.seekToPosition(x / rect.width);
  }
}
