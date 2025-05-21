import { store } from "./store";

export const API_BASE_URL = "http://localhost:5000";

// Models API
export async function getModels() {
  return store.getModels();
}

export async function createModel(
  voices: Record<string, string[]>,
  name: string
) {
  store.createModel(voices, name);
  return 200;
}

export async function loadModel(modelId: string) {
  const success = store.loadModel(modelId);
  return success ? 200 : 500;
}

export async function identifyVoice(modelId: string, audioFile: File) {
  return store.identifyVoice(modelId, audioFile);
}

// Helper function to get audio blob URL
export function getAudioUrl(voiceName: string, sampleName: string) {
  return store.getAudioBlobUrl(voiceName, sampleName);
}
