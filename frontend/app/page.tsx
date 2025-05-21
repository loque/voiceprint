import type { Metadata } from "next"
import { VoicesDashboard } from "@/components/voices-dashboard"

export const metadata: Metadata = {
  title: "Voices Dashboard | VoicePrint",
  description: "Manage voice samples for speaker identification",
}

export default function VoicesPage() {
  return <VoicesDashboard />
}
