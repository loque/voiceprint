import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths, components } from "./api.d";

const fetchClient = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:9797",
});

export const Api = createClient(fetchClient);
export type Api = typeof Api;

export type Library = components["schemas"]["LibraryOut"];
export type Speaker = components["schemas"]["SpeakerOut"];
