"use server";

import ky from "ky";
import { API_BASE_URL } from "./constants";
import { revalidatePath } from "next/cache";

export type SpeakersData = Record<string, string[]>;

export async function getSpeakers() {
  const res = await ky.get<SpeakersData>(`${API_BASE_URL}/speakers`);
  return res.json();
}

export async function addSpeaker({ name }: { name: string }) {
  "use server";
  await ky.post(`${API_BASE_URL}/speakers`, { json: { name } }).json();

  revalidatePath("/speakers");
}

export async function addSpeakerSample({
  speakerName,
  file,
}: {
  speakerName: string;
  file: File;
}) {
  "use server";
  const formData = new FormData();
  formData.append("file", file);
  await ky
    .post(`${API_BASE_URL}/speakers/${speakerName}/samples`, { body: formData })
    .json();

  revalidatePath("/speakers");
}

export async function deleteSpeakerSample({
  speakerName,
  sampleName,
}: {
  speakerName: string;
  sampleName: string;
}) {
  "use server";
  await ky.delete(
    `${API_BASE_URL}/speakers/${speakerName}/samples/${sampleName}`
  );
  revalidatePath("/speakers");
}
