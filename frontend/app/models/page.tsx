import type { Metadata } from "next";
import { ModelsDashboard } from "@/components/models-dashboard";
import { API_BASE_URL } from "@/lib/api";
import ky from "ky";
import { revalidatePath } from "next/cache";
import { VoiceData } from "@/lib/store";

export const metadata: Metadata = {
  title: "Models Dashboard | VoicePrint",
  description: "Manage speaker identification models",
};

export type IdentificationResult = {
  predicted_speaker: string;
  confidence: number;
  all_predictions: Record<string, number>;
  processing_time_ms: number;
};

export default async function ModelsPage() {
  const modelsData = await fetch(`${API_BASE_URL}/models`);
  const models = await modelsData.json();

  const voicesData = await fetch(`${API_BASE_URL}/voices`);
  const voices = await voicesData.json();

  async function createModel({
    name,
    voices,
  }: {
    name: string;
    voices: VoiceData;
  }) {
    "use server";
    await ky
      .post(`${API_BASE_URL}/models`, {
        json: {
          name,
          voices,
        },
        timeout: false,
      })
      .json();
    revalidatePath("/models");
  }

  async function loadModel({ modelId }: { modelId: string }) {
    "use server";
    await ky.put(`${API_BASE_URL}/models/${modelId}`);
    revalidatePath("/models");
  }

  async function identifyVoice({
    modelId,
    audioFile,
  }: {
    modelId: string;
    audioFile: File;
  }) {
    "use server";
    const formData = new FormData();
    formData.append("file", audioFile);
    const response = await ky
      .post(`${API_BASE_URL}/models/${modelId}/identify`, { body: formData })
      .json();
    revalidatePath("/models");
    return response as IdentificationResult;
  }
  return (
    <ModelsDashboard
      models={models}
      voices={voices}
      createModel={createModel}
      loadModel={loadModel}
      identifyVoice={identifyVoice}
    />
  );
}
