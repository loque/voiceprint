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
    const response = await ky
      .post(`${API_BASE_URL}/voices`, { json: { name } })
      .json();

    console.debug(">>> response", response);
    revalidatePath("/voices");
  }
  return <VoicesDashboard voices={voices} addVoice={addVoice} />;
}
