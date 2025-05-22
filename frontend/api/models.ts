"use server";

import ky from "ky";
import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "./constants";
import { SpeakersData } from "./speakers";

export type Model = {
  id: string;
  name: string;
  speakers: SpeakersData;
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
  speakers,
}: {
  name: string;
  speakers: SpeakersData;
}) {
  "use server";
  await ky
    .post(`${API_BASE_URL}/models`, {
      json: {
        name,
        speakers,
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

export async function identifySpeaker({
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
    .post(`${API_BASE_URL}/models/${modelId}/identify`, {
      body: formData,
      timeout: false,
    })
    .json();
  revalidatePath("/models");
  return response as IdentificationResult;
}
