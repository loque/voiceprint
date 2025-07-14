import { Route, Routes } from "react-router";
import { Layout } from "./app/Layout";
import { EnrollSpeaker } from "./app/EnrollSpeaker";
import { IdentifySpeaker } from "./app/IdentifySpeaker";
import { Speakers } from "./app/Speakers";
import { VoiceprintProvider } from "./lib/state";

export function App() {
  return (
    <VoiceprintProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={<div>Select a library or create a new one</div>}
          />
          <Route path="library/:libraryId">
            <Route index element={<div>Select an action</div>} />
            <Route path="identify-speaker" element={<IdentifySpeaker />} />
            <Route path="enroll-speaker" element={<EnrollSpeaker />} />
            <Route path="speakers" element={<Speakers />} />
          </Route>
        </Route>
      </Routes>
    </VoiceprintProvider>
  );
}
