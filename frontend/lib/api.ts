import { store, initializeStore, type VoiceData } from "./store";

export const API_BASE_URL = "http://localhost:5000";

// Initialize store with sample data
let storeInitialized = false;

async function ensureStoreInitialized() {
  if (storeInitialized) return;

  initializeStore();

  // Create sample audio files
  const sampleVoices = ["john", "sarah", "michael"];

  for (const voice of sampleVoices) {
    // Create 2 sample audio files for each voice
    for (let i = 1; i <= 2; i++) {
      // Create a simple audio blob (1 second of silence)
      const audioContext = new AudioContext();
      const buffer = audioContext.createBuffer(
        1,
        audioContext.sampleRate,
        audioContext.sampleRate
      );
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      // Convert to wav blob
      const offlineContext = new OfflineAudioContext(
        1,
        audioContext.sampleRate,
        audioContext.sampleRate
      );
      const offlineSource = offlineContext.createBufferSource();
      offlineSource.buffer = buffer;
      offlineSource.connect(offlineContext.destination);
      offlineSource.start();

      const renderedBuffer = await offlineContext.startRendering();
      const wavBlob = await bufferToWave(
        renderedBuffer,
        0,
        renderedBuffer.length
      );

      // Create a file from the blob
      const file = new File([wavBlob], `sample${i}.wav`, { type: "audio/wav" });

      // Add to store
      await store.addVoiceSample(voice, file);
    }
  }

  // Create a sample model
  const voices: VoiceData = {
    john: ["sample1.wav"],
    sarah: ["sample1.wav"],
  };

  store.createModel(voices, "Sample Model");

  storeInitialized = true;
}

// Helper function to convert AudioBuffer to WAV blob
function bufferToWave(
  abuffer: AudioBuffer,
  offset: number,
  len: number
): Promise<Blob> {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i, sample;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next source sample
  }

  // Helper function to set values
  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  return new Promise((resolve) => {
    resolve(new Blob([buffer], { type: "audio/wav" }));
  });
}

// Voices API
export async function getVoices() {
  await ensureStoreInitialized();
  return store.getVoices();
}

export async function addVoice(name: string) {
  await ensureStoreInitialized();
  const success = store.addVoice(name);
  return success ? 201 : 400;
}

export async function addVoiceSample(voiceName: string, file: File) {
  await ensureStoreInitialized();
  try {
    await store.addVoiceSample(voiceName, file);
    return 201;
  } catch (error) {
    console.error("Error adding voice sample:", error);
    return 400;
  }
}

export async function deleteVoiceSample(voiceName: string, sampleName: string) {
  await ensureStoreInitialized();
  const success = store.deleteVoiceSample(voiceName, sampleName);
  return success ? 200 : 404;
}

// Models API
export async function getModels() {
  await ensureStoreInitialized();
  return store.getModels();
}

export async function createModel(
  voices: Record<string, string[]>,
  name: string
) {
  await ensureStoreInitialized();
  store.createModel(voices, name);
  return 200;
}

export async function loadModel(modelId: string) {
  await ensureStoreInitialized();
  const success = store.loadModel(modelId);
  return success ? 200 : 500;
}

export async function identifyVoice(modelId: string, audioFile: File) {
  await ensureStoreInitialized();
  return store.identifyVoice(modelId, audioFile);
}

// Helper function to get audio blob URL
export function getAudioUrl(voiceName: string, sampleName: string) {
  return store.getAudioBlobUrl(voiceName, sampleName);
}
