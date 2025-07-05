// API Configuration
export const API_CONFIG = {
  // Default base URL - can be overridden via environment variable
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",

  // Request timeout in milliseconds
  TIMEOUT: 30000, // 30 seconds for file uploads

  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_AUDIO_FILES_FOR_ENROLLMENT: 5,

  // Supported audio file types
  SUPPORTED_AUDIO_TYPES: [
    "audio/wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
  ],

  // File extensions
  SUPPORTED_AUDIO_EXTENSIONS: [".wav", ".mp3", ".mp4", ".m4a", ".ogg", ".webm"],
} as const;

// Utility functions for validation
export const validateAudioFile = (file: File): string | null => {
  // Check file size
  if (file.size > API_CONFIG.MAX_FILE_SIZE) {
    return `File size exceeds ${
      API_CONFIG.MAX_FILE_SIZE / 1024 / 1024
    }MB limit`;
  }

  // Check file type
  if (
    !API_CONFIG.SUPPORTED_AUDIO_TYPES.includes(
      file.type as (typeof API_CONFIG.SUPPORTED_AUDIO_TYPES)[number]
    )
  ) {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = API_CONFIG.SUPPORTED_AUDIO_EXTENSIONS.some(
      (ext) => fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return `Unsupported file type. Supported types: ${API_CONFIG.SUPPORTED_AUDIO_EXTENSIONS.join(
        ", "
      )}`;
    }
  }

  return null; // No error
};

export const validateSpeakerName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return "Speaker name is required";
  }

  if (name.trim().length < 2) {
    return "Speaker name must be at least 2 characters long";
  }

  if (name.trim().length > 50) {
    return "Speaker name must be 50 characters or less";
  }

  // Check for invalid characters (optional - adjust as needed)
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return "Speaker name contains invalid characters";
  }

  return null; // No error
};
