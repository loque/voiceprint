import type { Metadata } from "next";
import { ModelsDashboard } from "@/components/models-dashboard";
import { API_BASE_URL } from "@/lib/api";

export const metadata: Metadata = {
  title: "Models Dashboard | VoicePrint",
  description: "Manage speaker identification models",
};

export default async function ModelsPage() {
  const modelsData = await fetch(`${API_BASE_URL}/models`);
  const models = await modelsData.json();

  const voicesData = await fetch(`${API_BASE_URL}/voices`);
  const voices = await voicesData.json();
  return <ModelsDashboard models={models} voices={voices} />;
}
