"use server";

import ky from "ky";
import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "./constants";
import { VoiceData } from "./voices";

export type Model = {
  id: string;
  name: string;
  voices: VoiceData;
  isLoaded?: boolean;
};

export type IdentificationResult = {
  predicted_speaker: string;
  confidence: number;
  all_predictions: Record<string, number>;
  processing_time_ms: number;
};

export async function getModels() {
  const res = await ky.get<Model[]>(`${API_BASE_URL}/models`);
  return res.json();
}

export async function createModel({
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

export async function loadModel({ modelId }: { modelId: string }) {
  "use server";
  await ky.put(`${API_BASE_URL}/models/${modelId}`);
  revalidatePath("/models");
}

export async function identifyVoice({
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
