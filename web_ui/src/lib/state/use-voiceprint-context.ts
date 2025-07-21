import { useContext } from "react";
import {
  VoiceprintContext,
  type VoiceprintContextValue,
} from "./voiceprint-context";

/**
 * Access the VoiceprintContext without automatically triggering a fetch.
 * Use this when you only need to read the current state or call specific actions.
 * Use useLibraries() instead if you want to automatically fetch libraries on first use.
 */
export function useVoiceprintContext(): VoiceprintContextValue {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error(
      "useVoiceprintContext must be used within a VoiceprintProvider"
    );
  }
  return context;
}
