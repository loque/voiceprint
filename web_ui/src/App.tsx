import { Route, Routes } from "react-router";
import { Layout } from "./app/Layout";
import { EnrollSpeaker } from "./app/EnrollSpeaker";
import { IdentifySpeaker } from "./app/IdentifySpeaker";
import { Options } from "./app/Options";
import { VoiceprintProvider } from "./lib/state/voiceprint-provider";
import { LibraryIndex } from "./app/LibraryIndex";
import { RootIndex } from "./app/RootIndex";

export function App() {
  return (
    <VoiceprintProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<RootIndex />} />
          <Route path="library/:libraryId">
            <Route index element={<LibraryIndex />} />
            <Route path="identify-speaker" element={<IdentifySpeaker />} />
            <Route path="enroll-speaker" element={<EnrollSpeaker />} />
            <Route path="options" element={<Options />} />
          </Route>
        </Route>
      </Routes>
    </VoiceprintProvider>
  );
}
