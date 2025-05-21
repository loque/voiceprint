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
  private models: Model[] = [];
  private audioBlobs: Record<string, AudioBlob> = {};

  // Voices methods
  getAudioBlobUrl(voiceName: string, sampleName: string): string | null {
    const key = `${voiceName}/${sampleName}`;
    return this.audioBlobs[key]?.url || null;
  }

  // Models methods

  createModel(voices: VoiceData, name: string): string {
    // Filter out voices with no samples
    const filteredVoices: VoiceData = {};
    Object.entries(voices).forEach(([voiceName, samples]) => {
      if (samples.length > 0) {
        filteredVoices[voiceName] = [...samples];
      }
    });

    const id = `model_${Date.now()}`;
    this.models.push({
      id,
      name,
      voices: filteredVoices,
    });

    return id;
  }
}

// Create a singleton instance
export const store = new Store();
