import type { Metadata } from "next";
import { VoicesDashboard } from "@/components/voices-dashboard";
import { API_BASE_URL } from "@/lib/api";
import { revalidatePath } from "next/cache";
import ky from "ky";

export const metadata: Metadata = {
  title: "Voices Dashboard | VoicePrint",
  description: "Manage voice samples for speaker identification",
};

export default async function VoicesPage() {
  const data = await fetch(`${API_BASE_URL}/voices`);
  const voices = await data.json();

  async function addVoice({ name }: { name: string }) {
    "use server";
    await ky.post(`${API_BASE_URL}/voices`, { json: { name } }).json();

    revalidatePath("/voices");
  }

  async function addVoiceSample({
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
  return (
    <VoicesDashboard
      voices={voices}
      addVoice={addVoice}
      addVoiceSample={addVoiceSample}
    />
  );
}
