import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { StoryComponents, StoryConfig, StoryEntry } from "./types";
import { Stories } from "./stories";
import "../index.css";

const modules = import.meta.glob("../**/*.stories.tsx", {
  eager: true,
});

const stories: StoryEntry[] = [];
for (const path in modules) {
  const story: StoryEntry = { name: "", components: [] };

  const mod = modules[path] as Record<string, unknown>;
  for (const key in mod) {
    if (Object.prototype.hasOwnProperty.call(mod, key)) {
      if (key === "config") {
        const config = mod[key] as StoryConfig;
        if (config.name) {
          story.name = config.name;
        } else {
          console.warn(`Story at ${path} does not have a name.`);
        }
      } else if (key === "Wrapper") {
        // Wrapper is a special case, we don't add it to components
        // but we can use it to wrap the story components
        story.Wrapper = mod[key] as StoryEntry["Wrapper"];
      } else {
        // check if mod[key] is a React component
        const Comp = mod[key] as StoryComponents["Component"];
        if (Comp && typeof Comp === "function") {
          story.components.push({
            name: Comp.displayName || key,
            Component: Comp,
          });
        }
      }
    }
  }

  stories.push(story);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Stories stories={stories} />
  </StrictMode>
);
