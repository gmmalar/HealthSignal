import { createServerFn } from "@tanstack/react-start";
import type { JsonValue } from "./types";

export interface HealthTopicInterpretation {
  summary: string;
  generatedBy: "Claude Sonnet";
}

type PromptBuilder = (data: Record<string, unknown>, stateLabel: string) => string;

const HEALTH_TOPIC_PROMPTS: Record<string, PromptBuilder> = {
  "air-quality": (data, stateLabel) =>
    `Air quality is ${data.category} in ${stateLabel || data.stateLabel || "this location"} today, with an AQI of ${data.aqi}. ${data.parameter} is the dominant pollutant. Translate this into 2-3 plain-language sentences a non-expert could understand in seconds. If AQI is Moderate or worse, mention that sensitive groups (children, elderly, those with respiratory conditions) may want to limit prolonged outdoor activity. No medical jargon.`,
  flu: (data, stateLabel) =>
    `${stateLabel} currently shows flu-like illness activity of ${data.activityLevel}% for ${data.reportingPeriod}. Translate this into 2-3 plain-language sentences, beginning by naming ${stateLabel}. If this is a low value (under 2%), note that it's currently outside peak flu season rather than implying something is wrong. No medical jargon.`,
  "disease-outbreaks": (data, stateLabel) =>
    `You are writing a public health briefing for one selected U.S. state.

The state is: ${stateLabel}

Never describe the reportedCases value as a national total. Always describe it as the surveillance count for the selected state. Begin the summary by naming the selected state.

Example: "Texas has reported 46 measles cases during CDC reporting Week 25."

Do not write "in the United States." Do not imply this is a nationwide count. Mention that the data comes from CDC national surveillance only as the reporting source, not as the geographic scope of the case count.

Condition: ${data.condition}
Reported cases: ${data.reportedCases}
Reporting period: ${data.reportingPeriod}

Translate this into 2-3 plain-language sentences. If reportedCases is 0, frame this as a positive result. Do not reference vaccination policy or politically charged framing. No medical jargon. Do not invent facts, estimate values, infer trends not present in the supplied data, or provide medical advice.`,
};

const GUARDRAIL =
  "Do not invent facts, estimate values, infer trends not present in the supplied data, or provide medical advice. Base your summary only on the supplied normalized data.";

const UNAVAILABLE_RESULT: HealthTopicInterpretation = {
  summary: "Current data for this topic and location is not available right now.",
  generatedBy: "Claude Sonnet",
};

const ERROR_RESULT: HealthTopicInterpretation = {
  summary: "Health summary is temporarily unavailable.",
  generatedBy: "Claude Sonnet",
};

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      json.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("\n")
        .trim() ?? "";
    if (!text) throw new Error("Empty Claude response");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export const interpretHealthTopic = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { topic: string; stateLabel?: string; normalizedData: JsonValue }) => input,
  )
  .handler(async ({ data }): Promise<HealthTopicInterpretation> => {
    const { topic, stateLabel, normalizedData } = data;
    const nd = (normalizedData ?? {}) as Record<string, unknown>;

    if (nd.dataStatus === "Unavailable") return UNAVAILABLE_RESULT;

    const builder = HEALTH_TOPIC_PROMPTS[topic];
    if (!builder) return ERROR_RESULT;

    const resolvedLabel =
      stateLabel || (nd.stateLabel as string | undefined) || "this location";
    const prompt = `${builder(nd, resolvedLabel)}\n\n${GUARDRAIL}`;

    try {
      const summary = await callClaude(prompt);
      return { summary, generatedBy: "Claude Sonnet" };
    } catch {
      return ERROR_RESULT;
    }
  });