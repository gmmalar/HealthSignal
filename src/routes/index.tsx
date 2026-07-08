import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Header } from "@/components/Header";
import { StateSelector } from "@/components/StateSelector";
import { TopicSelector } from "@/components/TopicSelector";
import { GenerateButton } from "@/components/GenerateButton";
import { HeroCard, type BriefingStatus } from "@/components/HeroCard";
import { Footer } from "@/components/Footer";
import { getHealthBriefing } from "@/services/healthIntelligenceManager.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthSignal — Public Health Intelligence" },
      {
        name: "description",
        content: "Simple, trustworthy public health briefings using verified public health data.",
      },
      { property: "og:title", content: "HealthSignal — Public Health Intelligence" },
      {
        property: "og:description",
        content: "Simple, trustworthy public health briefings using verified public health data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [briefingStatus, setBriefingStatus] = useState<BriefingStatus>("empty");
  const [briefingData, setBriefingData] = useState<Record<string, unknown> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [briefingMessage, setBriefingMessage] = useState<string | undefined>(undefined);
  const [freshnessInfo, setFreshnessInfo] = useState<
    | { status: "Verified" | "Recent" | "Stale" | "Unavailable"; badge: string }
    | undefined
  >(undefined);

  const isLoading = briefingStatus === "loading";

  const handleGenerate = async () => {
    if (isLoading) return;
    if (!selectedState || !selectedTopic) {
      setValidationError("Please select both a state and a health topic");
      return;
    }
    setValidationError(null);
    setBriefingStatus("loading");
    setBriefingData(null);
    setBriefingMessage(undefined);
    setFreshnessInfo(undefined);

    try {
      const outcome = await getHealthBriefing({
        state: selectedState,
        topic: selectedTopic,
      });
      if (outcome.status === "Verified") {
        setBriefingData(outcome.data as unknown as Record<string, unknown>);
        setBriefingStatus("success");
      } else if (outcome.status === "Unavailable") {
        setBriefingMessage(outcome.message);
        setFreshnessInfo(outcome.freshnessInfo);
        setBriefingStatus("unavailable");
      } else {
        setBriefingMessage(outcome.message);
        setFreshnessInfo(outcome.freshnessInfo);
        setBriefingStatus("error");
      }
    } catch {
      setBriefingMessage("Something went wrong generating your briefing.");
      setBriefingStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="w-full max-w-3xl space-y-8">
          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StateSelector value={selectedState} onChange={setSelectedState} />
              <TopicSelector value={selectedTopic} onChange={setSelectedTopic} />
            </div>
            <GenerateButton onClick={handleGenerate} isLoading={isLoading} />
            {validationError && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {validationError}
              </p>
            )}
          </div>

          {/* Hero Card */}
          <HeroCard
            status={briefingStatus}
            data={briefingData}
            message={briefingMessage}
            freshnessInfo={freshnessInfo}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
