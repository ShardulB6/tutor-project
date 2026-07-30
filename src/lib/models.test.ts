import { describe, expect, it } from "vitest";
import { defineTutorReasoning, getTutorReasoningConfig, supportsTutorReasoning } from "./models";

describe("tutor model reasoning", () => {
  it("identifies models that support configurable reasoning", () => {
    expect(supportsTutorReasoning("openai/gpt-4o-mini")).toBe(false);
    expect(supportsTutorReasoning("openai/o1")).toBe(true);
  });

  it("preserves OpenAI reasoning effort without exposing unavailable summaries", () => {
    expect(getTutorReasoningConfig("openai/o1", "medium")).toEqual({
      providerOptions: {
        openai: {
          reasoningEffort: "medium",
        },
      },
      sendReasoning: false,
    });
  });

  it("enables available OpenAI reasoning summaries", () => {
    expect(getTutorReasoningConfig("openai/o3", "high")).toEqual({
      providerOptions: {
        openai: {
          reasoningEffort: "high",
          reasoningSummary: "auto",
        },
      },
      sendReasoning: true,
    });
  });

  it("adapts the universal reasoning level for any provider", () => {
    const configureReasoning = defineTutorReasoning({
      provider: "example",
      sendReasoning: true,
      getProviderOptions: (level) => ({
        thinkingLevel: level,
      }),
    });

    expect(configureReasoning("low")).toEqual({
      providerOptions: {
        example: {
          thinkingLevel: "low",
        },
      },
      sendReasoning: true,
    });
  });
});
