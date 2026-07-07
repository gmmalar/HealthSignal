import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Header } from "@/components/Header";
import { StateSelector } from "@/components/StateSelector";
import { TopicSelector } from "@/components/TopicSelector";
import { GenerateButton } from "@/components/GenerateButton";
import { HeroCard } from "@/components/HeroCard";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthSignal — Public Health Intelligence" },
      { name: "description", content: "Simple, trustworthy public health briefings using verified public health data." },
      { property: "og:title", content: "HealthSignal — Public Health Intelligence" },
      { property: "og:description", content: "Simple, trustworthy public health briefings using verified public health data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type CardState = "empty" | "loading" | "success";

function Index() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [cardState, setCardState] = useState<CardState>("empty");
  const [isLoading, setIsLoading] = useState(false);

  const canGenerate = selectedState !== "" && selectedTopic !== "";

  const handleGenerate = () => {
    if (!canGenerate) return;
    setCardState("loading");
    setIsLoading(true);

    // Simulate a network request
    setTimeout(() => {
      setCardState("success");
      setIsLoading(false);
    }, 2000);
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
            <GenerateButton
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={!canGenerate}
            />
          </div>

          {/* Hero Card */}
          <HeroCard state={cardState} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
