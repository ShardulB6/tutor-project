export type TutorModel = {
  id: string;
  provider: string;
  name: string;
};

export const CHAT_TITLE_MODEL = "openai/gpt-5-nano" as const;

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
  },
  {
    id: "openai/gpt-5.4",
    provider: "Open AI",
    name: "GPT-5.4",
  },
  {
    id: "openai/gpt-5.6-sol",
    provider: "Open AI",
    name: "GPT-5.6 Sol",
  },
  {
    id: "openai/gpt-5.6-luna",
    provider: "Open AI",
    name: "GPT-5.6 Luna",
  },
  {
    id: "openai/gpt-5.6-terra",
    provider: "Open AI",
    name: "GPT-5.6 Terra",
  },
] as const satisfies readonly TutorModel[];

export type TutorModelId = (typeof TUTOR_MODELS)[number]["id"];

export const DEFAULT_TUTOR_MODEL: TutorModelId = TUTOR_MODELS[0].id;

export const TUTOR_REASONING_LEVELS = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
] as const;

export type TutorReasoningLevel = (typeof TUTOR_REASONING_LEVELS)[number]["id"];

export const DEFAULT_TUTOR_REASONING_LEVEL: TutorReasoningLevel = "medium";

const REASONING_MODEL_IDS: ReadonlySet<TutorModelId> = new Set([
  "openai/o1",
  "openai/o3",
  "openai/gpt-5.4",
  "openai/gpt-5.6-sol",
  "openai/gpt-5.6-luna",
  "openai/gpt-5.6-terra",
]);

const REASONING_SUMMARY_MODEL_IDS: ReadonlySet<TutorModelId> = new Set([
  "openai/o3",
  "openai/gpt-5.4",
]);

export function isTutorModelId(value: unknown): value is TutorModelId {
  return typeof value === "string" && TUTOR_MODELS.some((model) => model.id === value);
}

export function isTutorReasoningLevel(value: unknown): value is TutorReasoningLevel {
  return typeof value === "string" && TUTOR_REASONING_LEVELS.some((level) => level.id === value);
}

export function supportsTutorReasoning(modelId: TutorModelId): boolean {
  return REASONING_MODEL_IDS.has(modelId);
}

export function supportsTutorReasoningSummary(modelId: TutorModelId): boolean {
  return REASONING_SUMMARY_MODEL_IDS.has(modelId);
}
