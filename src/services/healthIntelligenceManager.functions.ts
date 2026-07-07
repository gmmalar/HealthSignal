import { getAirQuality } from "./airQuality.functions";
import { getFlu } from "./flu.functions";
import { getDiseaseOutbreaks } from "./diseaseOutbreaks.functions";
import { interpretHealthTopic } from "./healthTopicAgent.functions";
import type { HealthSignalResponse, JsonValue } from "./types";

export type BriefingOutcome =
  | { status: "Verified"; data: HealthSignalResponse }
  | { status: "Unavailable"; message: string }
  | { status: "Error"; message: string };

type AdapterFn = (args: { data: { state: string } }) => Promise<unknown>;

interface TopicConfig {
  fn: AdapterFn;
  unavailableMessage: string;
  errorMessage: string;
}

const TOPIC_HANDLERS: Record<string, TopicConfig> = {
  "air-quality": {
    fn: getAirQuality as unknown as AdapterFn,
    unavailableMessage: "No current monitoring data available for this reporting area.",
    errorMessage: "Unable to retrieve live Air Quality data. Please try again.",
  },
  flu: {
    fn: getFlu as unknown as AdapterFn,
    unavailableMessage:
      "No surveillance data reported for this state during the selected reporting period.",
    errorMessage: "Unable to retrieve live Flu data. Please try again.",
  },
  "disease-outbreaks": {
    fn: getDiseaseOutbreaks as unknown as AdapterFn,
    unavailableMessage:
      "No verified surveillance data available for this state and reporting period.",
    errorMessage: "Unable to retrieve live Disease Outbreak data. Please try again.",
  },
};

function mockBriefing(state: string, topic: string): HealthSignalResponse {
  return {
    topic,
    state,
    stateLabel: state,
    status: "Verified",
    freshness: "Mock Freshness",
    source: "Mock",
    lastUpdated: "Mock Freshness",
    rawData: null,
    normalizedData: {
      summary: `Mock briefing for ${topic} in ${state}.`,
    } as JsonValue,
  };
}

function normalizeAdapterResult(
  result: Record<string, unknown>,
  topic: string,
  state: string,
): HealthSignalResponse {
  const nd = (result.normalizedData ?? {}) as Record<string, unknown>;
  const pick = (k: string) => (nd[k] ?? result[k]) as unknown;
  return {
    topic: (result.topic as string) ?? topic,
    state: (result.state as string) ?? state,
    stateLabel:
      (result.stateLabel as string) ?? (nd.stateLabel as string) ?? state,
    status: "Verified",
    freshness: (pick("freshness") as string) ?? "",
    source: (pick("source") as string) ?? "",
    lastUpdated: (pick("lastUpdated") as string) ?? "",
    rawData: (nd.rawData ?? result.rawData ?? null) as JsonValue,
    normalizedData: nd as JsonValue,
  };
}

export async function getHealthBriefing({
  state,
  topic,
}: {
  state: string;
  topic: string;
}): Promise<BriefingOutcome> {
  const handler = TOPIC_HANDLERS[topic];

  // Fallback to mock data only when the topic has no adapter at all.
  // State coverage is owned by each adapter, not the manager.
  if (!handler) {
    await new Promise((r) => setTimeout(r, 2000));
    return { status: "Verified", data: mockBriefing(state, topic) };
  }

  try {
    const raw = (await handler.fn({ data: { state } })) as Record<string, unknown>;
    const statusRaw = String(raw.status ?? "").toLowerCase();

    if (statusRaw === "success" || statusRaw === "verified") {
      const data = normalizeAdapterResult(raw, topic, state);
      // Specialist agents (sequential). Currently: Health Topic Agent.
      // [FUTURE] Freshness Agent → Trend Agent → (Health Topic Agent) → Alert Agent → Recommendation Agent
      try {
        const interpretation = await interpretHealthTopic({
          data: {
            topic: data.topic,
            stateLabel: data.stateLabel,
            normalizedData: data.normalizedData,
          },
        });
        data.summary = interpretation.summary;
        data.generatedBy = interpretation.generatedBy;
      } catch {
        data.summary = "Health summary is temporarily unavailable.";
        data.generatedBy = "Claude Sonnet";
      }
      return { status: "Verified", data };
    }
    if (statusRaw === "unavailable") {
      return { status: "Unavailable", message: handler.unavailableMessage };
    }
    return { status: "Error", message: handler.errorMessage };
  } catch {
    return { status: "Error", message: handler.errorMessage };
  }
}
