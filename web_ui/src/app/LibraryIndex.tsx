import { BodySectionContent, BodySectionHeader } from "@/components/ui/body";
import { Button } from "@/components/ui/button";
import { EmptyScreen } from "@/components/ui/empty-screen";
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
    header = "Enroll Speakers";
    description = "Enroll at least two speakers to use identification.";
    link = `/library/${library.id}/enroll-speaker`;
    linkLabel = "Enroll Speaker";
  } else {
    header = "Identify a speaker";
    description = "Go to the Identify Speaker page to start identification.";
    link = `/library/${library.id}/identify-speaker`;
    linkLabel = "Identify speaker";
  }
  return (
    <EmptyScreen>
      <BodySectionHeader>{header}</BodySectionHeader>
      <BodySectionContent className="flex flex-col items-center gap-4">
        {description}
        <Button asChild>
          <Link to={link}>{linkLabel}</Link>
        </Button>
      </BodySectionContent>
    </EmptyScreen>
  );
}
