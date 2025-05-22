import type { Metadata } from "next";
import { SpeakersDashboard } from "@/components/speakers-dashboard";
import {
  addSpeaker,
  addSpeakerSample,
  deleteSpeakerSample,
  getSpeakers,
} from "@/api/speakers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Speakers Dashboard | Voiceprint",
  description: "Manage voice samples for speaker identification",
};

export default async function SpeakersPage() {
  const speakers = await getSpeakers();

  return (
    <SpeakersDashboard
      speakers={speakers}
      addSpeaker={addSpeaker}
      addSpeakerSample={addSpeakerSample}
      deleteSpeakerSample={deleteSpeakerSample}
    />
  );
}
