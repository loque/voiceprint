"use server";

import ky from "ky";
import { API_BASE_URL } from "./constants";
import { revalidatePath } from "next/cache";
import { VoiceData } from "./dto";

export async function getVoices() {
  const res = await ky.get<VoiceData>(`${API_BASE_URL}/voices`);
  return res.json();
}

export async function addVoice({ name }: { name: string }) {
  "use server";
  await ky.post(`${API_BASE_URL}/voices`, { json: { name } }).json();

  revalidatePath("/voices");
}

export async function addVoiceSample({
  voiceName,
  file,
}: {
  voiceName: string;
  file: File;
}) {
  "use server";
  const formData = new FormData();
  formData.append("file", file);
  await ky
    .post(`${API_BASE_URL}/voices/${voiceName}/samples`, { body: formData })
    .json();

  revalidatePath("/voices");
}

export async function deleteVoiceSample({
  voiceName,
  sampleName,
}: {
  voiceName: string;
  sampleName: string;
}) {
  "use server";
  await ky.delete(`${API_BASE_URL}/voices/${voiceName}/samples/${sampleName}`);
  revalidatePath("/voices");
}
