export type VoiceData = Record<string, string[]>;

export type Model = {
  id: string;
  name: string;
  voices: VoiceData;
  isLoaded?: boolean;
};
