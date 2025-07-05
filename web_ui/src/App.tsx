import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrollSpeakerTab } from "@/app/EnrollSpeakerTab";
import { IdentifySpeakerTab } from "@/app/IdentifySpeakerTab";
import { SpeakersManagementTab } from "@/app/SpeakersManagementTab";
import { useListSpeakers } from "@/lib/api/hooks";

export function App() {
  const { data: speakers = [], isLoading: isLoadingSpeakers } =
    useListSpeakers();

  console.debug(">>> isLoadingSpeakers", { isLoadingSpeakers, speakers });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Speaker Identification Dashboard
        </h1>

        <Tabs defaultValue="enroll" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 mb-8">
            <TabsTrigger
              value="enroll"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              Enroll Speaker
            </TabsTrigger>
            <TabsTrigger
              value="identify"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              Identify Speaker
            </TabsTrigger>
            <TabsTrigger
              value="management"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              Speakers Management
            </TabsTrigger>
          </TabsList>

          <EnrollSpeakerTab />
          <IdentifySpeakerTab />
          <SpeakersManagementTab speakers={speakers} />
        </Tabs>
      </div>
    </div>
  );
}
