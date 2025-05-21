import { store } from "./store";

export const API_BASE_URL = "http://localhost:5000";

// Models API
export async function createModel(
  voices: Record<string, string[]>,
  name: string
) {
  store.createModel(voices, name);
  return 200;
}

// Helper function to get audio blob URL
export function getAudioUrl(voiceName: string, sampleName: string) {
  return store.getAudioBlobUrl(voiceName, sampleName);
}
