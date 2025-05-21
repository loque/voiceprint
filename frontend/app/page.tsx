import type { Metadata } from "next";
import { VoicesDashboard } from "@/components/voices-dashboard";
import {
  addVoice,
  addVoiceSample,
  deleteVoiceSample,
  getVoices,
} from "@/api/voices";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Voices Dashboard | VoicePrint",
  description: "Manage voice samples for speaker identification",
};

export default async function VoicesPage() {
  const voices = await getVoices();

  return (
    <VoicesDashboard
      voices={voices}
      addVoice={addVoice}
      addVoiceSample={addVoiceSample}
      deleteVoiceSample={deleteVoiceSample}
    />
  );
}
