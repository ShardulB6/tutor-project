export type TutorModel = {
  id: string;
  provider: string;
  name: string;
};

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
] as const satisfies readonly TutorModel[];

export type TutorModelId = (typeof TUTOR_MODELS)[number]["id"];

export const DEFAULT_TUTOR_MODEL: TutorModelId = TUTOR_MODELS[0].id;

export function isTutorModelId(value: unknown): value is TutorModelId {
  return typeof value === "string" && TUTOR_MODELS.some((model) => model.id === value);
}
