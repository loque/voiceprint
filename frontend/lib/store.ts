// In-memory store for mock data
export type VoiceData = Record<string, string[]>;

export type Model = {
  id: string;
  name: string;
  voices: VoiceData;
  isLoaded?: boolean;
};

// Mock audio blob storage
export type AudioBlob = {
  url: string;
  blob: Blob;
};

class Store {
  private audioBlobs: Record<string, AudioBlob> = {};

  // Voices methods
  getAudioBlobUrl(voiceName: string, sampleName: string): string | null {
    const key = `${voiceName}/${sampleName}`;
    return this.audioBlobs[key]?.url || null;
  }
}

// Create a singleton instance
export const store = new Store();
