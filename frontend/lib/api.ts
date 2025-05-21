import { store } from "./store";

export const API_BASE_URL = "http://localhost:5000";

// Helper function to get audio blob URL
export function getAudioUrl(voiceName: string, sampleName: string) {
  return store.getAudioBlobUrl(voiceName, sampleName);
}
