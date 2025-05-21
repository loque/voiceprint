import type { Metadata } from "next"
import { ModelsDashboard } from "@/components/models-dashboard"

export const metadata: Metadata = {
  title: "Models Dashboard | VoicePrint",
  description: "Manage speaker identification models",
}

export default function ModelsPage() {
  return <ModelsDashboard />
}
