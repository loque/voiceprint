import { BodySectionContent, BodySectionHeader } from "@/components/ui/body";
import { Button } from "@/components/ui/button";
import { EmptyScreen } from "@/components/ui/empty-screen";
import { Header, HeaderTitle } from "@/components/ui/header";
import { useCurrentLibrary } from "@/lib/state/use-current-library";
import { Link } from "react-router";

export function LibraryIndex() {
  const library = useCurrentLibrary();
  if (!library) {
    return <EmptyScreen>No library selected</EmptyScreen>;
  }
  const speakers = library?.speakers || [];
  let header;
  let description;
  let link;
  let linkLabel;

  if (speakers.length < 2) {
    header = "Get started!";
    description =
      "Enroll at least two speakers to try the speaker identification.";
    link = `/library/${library.id}/enroll-speaker`;
    linkLabel = "Enroll Speaker";
  } else {
    header = "Ready to identify!";
    description =
      "You have enough speakers enrolled to try the speaker identification.";
    link = `/library/${library.id}/identify-speaker`;
    linkLabel = "Identify speaker";
  }
  return (
    <>
      <Header>
        <HeaderTitle>{library.name}</HeaderTitle>
      </Header>
      <EmptyScreen>
        <BodySectionHeader>{header}</BodySectionHeader>
        <BodySectionContent className="flex flex-col items-center gap-4">
          {description}
          <Button asChild>
            <Link to={link}>{linkLabel}</Link>
          </Button>
        </BodySectionContent>
      </EmptyScreen>
    </>
  );
}
