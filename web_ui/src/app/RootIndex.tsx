import { BodySectionHeader } from "@/components/ui/body";
import { EmptyScreen } from "@/components/ui/empty-screen";

export function RootIndex() {
  return (
    <>
      <EmptyScreen>
        <BodySectionHeader>
          Create or import a voice library to get started
        </BodySectionHeader>
      </EmptyScreen>
    </>
  );
}
