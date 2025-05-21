import type { Metadata } from "next";
import { VoicesDashboard } from "@/components/voices-dashboard";
import { API_BASE_URL } from "@/lib/api";

export const metadata: Metadata = {
  title: "Voices Dashboard | VoicePrint",
  description: "Manage voice samples for speaker identification",
};

export default async function VoicesPage() {
  const data = await fetch(`${API_BASE_URL}/voices`);
  const voices = await data.json();
  return <VoicesDashboard voices={voices} />;
}
