import type { Metadata } from "next";
import { ModelsDashboard } from "@/components/models-dashboard";
import { getModels, createModel, loadModel, identifyVoice } from "@/api/models";
import { getVoices } from "@/api/voices";

export const metadata: Metadata = {
  title: "Models Dashboard | VoicePrint",
  description: "Manage speaker identification models",
};

export default async function ModelsPage() {
  const models = await getModels();
  const voices = await getVoices();

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
