import type { OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import type { JSONValue } from "ai";

export const TUTOR_REASONING_LEVELS = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
] as const;

export type TutorReasoningLevel = (typeof TUTOR_REASONING_LEVELS)[number]["id"];

export const DEFAULT_TUTOR_REASONING_LEVEL: TutorReasoningLevel = "medium";

export type TutorReasoningTurnConfig = {
  providerOptions: Record<string, Record<string, JSONValue>>;
  sendReasoning: boolean;
};

export type TutorReasoningAdapter = (level: TutorReasoningLevel) => TutorReasoningTurnConfig;

export type TutorModel = {
  id: string;
  provider: string;
  name: string;
  reasoning?: TutorReasoningAdapter;
};

export const CHAT_TITLE_MODEL = "openai/gpt-5-nano" as const;

export function defineTutorReasoning({
  getProviderOptions,
  provider,
  sendReasoning,
}: {
  getProviderOptions: (level: TutorReasoningLevel) => Record<string, JSONValue>;
  provider: string;
  sendReasoning: boolean;
}): TutorReasoningAdapter {
  return (level) => ({
    providerOptions: {
      [provider]: getProviderOptions(level),
    },
    sendReasoning,
  });
}

function defineOpenAIReasoning(sendReasoning: boolean): TutorReasoningAdapter {
  return defineTutorReasoning({
    provider: "openai",
    sendReasoning,
    getProviderOptions: (level) =>
      ({
        reasoningEffort: level,
        ...(sendReasoning ? { reasoningSummary: "auto" } : {}),
      }) satisfies OpenAILanguageModelResponsesOptions,
  });
}

export const TUTOR_MODELS = [
  {
    id: "openai/gpt-4o-mini",
    provider: "Open AI",
    name: "GPT-4o mini",
  },
  {
    id: "openai/o1",
    provider: "Open AI",
    name: "o1",
    reasoning: defineOpenAIReasoning(false),
  },
  {
    id: "openai/gpt-4.1-mini",
    provider: "Open AI",
    name: "GPT-4.1 mini",
  },
  {
    id: "openai/o3",
    provider: "Open AI",
    name: "o3",
    reasoning: defineOpenAIReasoning(true),
  },
  {
    id: "openai/gpt-5.4",
    provider: "Open AI",
    name: "GPT-5.4",
    reasoning: defineOpenAIReasoning(true),
  },
] as const satisfies readonly TutorModel[];

export type TutorModelId = (typeof TUTOR_MODELS)[number]["id"];

export const DEFAULT_TUTOR_MODEL: TutorModelId = TUTOR_MODELS[0].id;

export function isTutorModelId(value: unknown): value is TutorModelId {
  return typeof value === "string" && TUTOR_MODELS.some((model) => model.id === value);
}

export function isTutorReasoningLevel(value: unknown): value is TutorReasoningLevel {
  return typeof value === "string" && TUTOR_REASONING_LEVELS.some((level) => level.id === value);
}

export function supportsTutorReasoning(modelId: TutorModelId): boolean {
  const model: TutorModel | undefined = TUTOR_MODELS.find(({ id }) => id === modelId);
  return model?.reasoning !== undefined;
}

export function getTutorReasoningConfig(
  modelId: TutorModelId,
  level: TutorReasoningLevel,
): TutorReasoningTurnConfig | undefined {
  const model: TutorModel | undefined = TUTOR_MODELS.find(({ id }) => id === modelId);
  return model?.reasoning?.(level);
}
