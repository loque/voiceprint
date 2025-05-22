import type { Metadata } from "next";
import { ModelsDashboard } from "@/components/models-dashboard";
import {
  getModels,
  createModel,
  loadModel,
  identifySpeaker,
} from "@/api/models";
import { getSpeakers } from "@/api/speakers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Models Dashboard | Voiceprint",
  description: "Manage speaker identification models",
};

export default async function ModelsPage() {
  const models = await getModels();
  const speakers = await getSpeakers();

  return (
    <ModelsDashboard
      models={models}
      speakers={speakers}
      createModel={createModel}
      loadModel={loadModel}
      identifySpeaker={identifySpeaker}
    />
  );
}
