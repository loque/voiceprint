export interface StoryConfig {
  name: string;
}

export interface StoryComponents {
  name: string;
  Component: React.ComponentType;
}

export interface StoryEntry {
  name: string;
  Wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  components: StoryComponents[];
}
