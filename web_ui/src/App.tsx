import { useState } from "react";
import { Route, Routes, useNavigate } from "react-router";
import { Setup } from "./app/Setup";
import { Api, type Library } from "./lib/api/api";
import { Layout } from "./app/Layout";
import { EnrollSpeaker } from "./app/EnrollSpeaker";

export function App() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState<Library | null>(null);

  // List libraries
  const { data: libraries } = Api.useQuery("get", "/libraries");

  // Load library
  const { mutate: loadLibrary } = Api.useMutation(
    "post",
    `/libraries/{library_id}`,
    {
      onSuccess: (data) => {
        if (data) {
          setLibrary(data);
          navigate("/enroll-speaker");
        }
      },
    }
  );
  function onLoadLibrary(libraryId: string) {
    return loadLibrary({ params: { path: { library_id: libraryId } } });
  }

  // Create library
  const { mutate: createLibrary } = Api.useMutation("post", "/libraries", {
    onSuccess: (data) => {
      if (data) {
        navigate("/enroll-speaker");
      }
    },
  });
  function onCreateLibrary(name: string) {
    return createLibrary({ params: { query: { name } } });
  }

  return (
    <div>
      <Routes>
        {/* <Route index element={<div>Loading...</div>} /> */}
        <Route
          index
          path="/setup"
          element={
            <Setup
              libraries={libraries || []}
              onLoadLibrary={onLoadLibrary}
              onCreateLibrary={onCreateLibrary}
            />
          }
        />
        <Route element={<Layout />}>
          <Route
            index
            path="/enroll-speaker"
            element={<EnrollSpeaker library={library} />}
          />
        </Route>
      </Routes>
    </div>
  );
}
