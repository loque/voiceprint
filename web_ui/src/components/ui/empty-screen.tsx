import type { PropsWithChildren } from "react";
import { Body, BodySection } from "./body";

export function EmptyScreen({ children }: PropsWithChildren) {
  return (
    <Body>
      <BodySection className="items-center pt-32">{children}</BodySection>
    </Body>
  );
}
