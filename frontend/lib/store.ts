// In-memory store for mock data
export type VoiceData = Record<string, string[]>

export type Model = {
  id: string
  name: string
  voices: VoiceData
  isActive?: boolean
}

// Mock audio blob storage
export type AudioBlob = {
  url: string
  blob: Blob
}

class Store {
  private voices: VoiceData = {}
  private models: Model[] = []
  private audioBlobs: Record<string, AudioBlob> = {}
  private activeModelId: string | null = null

  // Voices methods
  getVoices(): VoiceData {
    return { ...this.voices }
  }

  addVoice(name: string): boolean {
    if (this.voices[name]) {
      return false // Voice already exists
    }
    this.voices[name] = []
    return true
  }

  addVoiceSample(voiceName: string, file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.voices[voiceName]) {
        reject(new Error("Voice not found"))
        return
      }

      // Create a unique filename if one with the same name already exists
      let fileName = file.name
      if (this.voices[voiceName].includes(fileName)) {
        const nameParts = fileName.split(".")
        const ext = nameParts.pop() || ""
        const baseName = nameParts.join(".")
        fileName = `${baseName}_${Date.now()}.${ext}`
      }

      // Store the file blob
      const blobUrl = URL.createObjectURL(file)
      this.audioBlobs[`${voiceName}/${fileName}`] = {
        url: blobUrl,
        blob: file,
      }

      // Add the filename to the voice samples
      this.voices[voiceName].push(fileName)
      resolve(true)
    })
  }

  deleteVoiceSample(voiceName: string, sampleName: string): boolean {
    if (!this.voices[voiceName] || !this.voices[voiceName].includes(sampleName)) {
      return false
    }

    // Remove from voice samples
    this.voices[voiceName] = this.voices[voiceName].filter((sample) => sample !== sampleName)

    // Release the blob URL
    const key = `${voiceName}/${sampleName}`
    if (this.audioBlobs[key]) {
      URL.revokeObjectURL(this.audioBlobs[key].url)
      delete this.audioBlobs[key]
    }

    return true
  }

  getAudioBlobUrl(voiceName: string, sampleName: string): string | null {
    const key = `${voiceName}/${sampleName}`
    return this.audioBlobs[key]?.url || null
  }

  // Models methods
  getModels(): Model[] {
    return [...this.models]
  }

  createModel(voices: VoiceData, name: string): string {
    // Filter out voices with no samples
    const filteredVoices: VoiceData = {}
    Object.entries(voices).forEach(([voiceName, samples]) => {
      if (samples.length > 0) {
        filteredVoices[voiceName] = [...samples]
      }
    })

    const id = `model_${Date.now()}`
    this.models.push({
      id,
      name,
      voices: filteredVoices,
    })

    return id
  }

  loadModel(modelId: string): boolean {
    const model = this.models.find((m) => m.id === modelId)
    if (!model) {
      return false
    }

    // Deactivate all models
    this.models.forEach((m) => {
      m.isActive = false
    })

    // Activate the selected model
    model.isActive = true
    this.activeModelId = modelId
    return true
  }

  identifyVoice(modelId: string, audioFile: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const model = this.models.find((m) => m.id === modelId)
      if (!model) {
        reject(new Error("Model not found"))
        return
      }

      // Get all voices in the model
      const voices = Object.keys(model.voices)
      if (voices.length === 0) {
        reject(new Error("Model has no voices"))
        return
      }

      // Simulate processing time
      setTimeout(() => {
        // Randomly select a voice as the "predicted" one with higher confidence
        const predictedIndex = Math.floor(Math.random() * voices.length)
        const predictedSpeaker = voices[predictedIndex]

        // Generate random confidence scores for all voices
        const allPredictions: Record<string, number> = {}
        let totalConfidence = 0

        voices.forEach((voice) => {
          // Generate a random confidence value
          let confidence = Math.random()
          // Boost the predicted speaker's confidence
          if (voice === predictedSpeaker) {
            confidence *= 3
          }
          totalConfidence += confidence
          allPredictions[voice] = confidence
        })

        // Normalize confidence scores to sum to 1
        Object.keys(allPredictions).forEach((voice) => {
          allPredictions[voice] /= totalConfidence
        })

        // Return the result
        resolve({
          predicted_speaker: predictedSpeaker,
          confidence: allPredictions[predictedSpeaker],
          all_predictions: allPredictions,
          processing_time_ms: Math.floor(Math.random() * 500) + 100, // Random processing time between 100-600ms
        })
      }, 1500) // Simulate 1.5s processing time
    })
  }
}

// Create a singleton instance
export const store = new Store()

// Initialize with some sample data
export function initializeStore() {
  // Add sample voices
  store.addVoice("john")
  store.addVoice("sarah")
  store.addVoice("michael")

  // We'll add sample files programmatically in the API module
}
