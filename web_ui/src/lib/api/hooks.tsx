// src/hooks/speakers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type SpeakerName = string & { readonly _speaker_name: unique symbol };

export function useListSpeakers() {
  return useQuery<SpeakerName[], Error>({
    queryKey: ["speakers"],
    queryFn: () =>
      api
        .get<{ speakers: SpeakerName[] }>("/speakers")
        .then((res) => res.data.speakers),
  });
}

interface EnrollParams {
  name: SpeakerName;
  files: File[];
}
export function useEnrollSpeaker() {
  const qc = useQueryClient();
  return useMutation<void, Error, EnrollParams>({
    mutationFn: ({ name, files }) => {
      const form = new FormData();
      form.append("name", name);
      files.forEach((f) => form.append("audio_files", f));
      return api.post("/speakers/enroll", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["speakers"] }),
  });
}

export function useDeleteSpeaker() {
  const qc = useQueryClient();
  return useMutation<void, Error, SpeakerName>({
    mutationFn: (name: SpeakerName) =>
      api.delete(`/speakers/${encodeURIComponent(name)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["speakers"] }),
  });
}

export function useIdentifySpeaker() {
  return useMutation<SpeakerName, Error, File>({
    mutationFn: (file) => {
      const form = new FormData();
      form.append("audio_file", file);
      return api
        .post<{ identified_speaker: SpeakerName }>("/speakers/identify", form, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => res.data.identified_speaker);
    },
  });
}
