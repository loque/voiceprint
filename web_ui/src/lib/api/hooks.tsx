// src/hooks/speakers.ts
import { Api } from "./api";

export interface Speaker {
  id: string;
  name: string;
}

export function useListLibraries() {
  return Api.useQuery("get", "/libraries");
}

export function useCreateLibrary() {
  return Api.useMutation("post", "/libraries");
}

export function useImportLibrary() {
  return Api.useMutation("post", "/libraries/import");
}

export function useLoadLibrary() {
  return Api.useMutation("post", `/libraries/{library_id}`);
}

export function useDeleteLibrary() {
  return Api.useMutation("delete", `/libraries/{library_id}`);
}

export function useEnrollSpeaker() {
  return Api.useMutation("post", "/libraries/{library_id}/speakers");
}

export function useDeleteSpeaker() {
  return Api.useMutation(
    "delete",
    "/libraries/{library_id}/speakers/{speaker_id}"
  );
}

export function useIdentifySpeaker() {
  return Api.useMutation("post", "/libraries/{library_id}/identify");
}
