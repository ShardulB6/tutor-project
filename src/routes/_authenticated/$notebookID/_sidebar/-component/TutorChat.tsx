"use client";

import { useAgentChat } from "@cloudflare/ai-chat/react";
import { useRouter } from "@tanstack/react-router";
import { useAgent } from "agents/react";
import { BotIcon, CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "#/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "#/components/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "#/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "#/components/ai-elements/prompt-input";
import { DEFAULT_TUTOR_MODEL, TUTOR_MODELS, type TutorModelId } from "#/lib/models";
import { cn } from "#/lib/utils";

type TutorChatProps = {
  notebookID: string;
  sessionID: string;
};

export function TutorChat({ notebookID, sessionID }: TutorChatProps) {
  const router = useRouter();
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<TutorModelId>(DEFAULT_TUTOR_MODEL);
  const agent = useAgent({
    agent: "TutorAgent",
    name: `${notebookID}:${sessionID}`,
  });
  const { messages, sendMessage, status, stop } = useAgentChat({
    agent,
    body: () => ({ model: selectedModelId }),
  });
  const isBusy = status === "submitted" || status === "streaming";
  const selectedModel =
    TUTOR_MODELS.find((model) => model.id === selectedModelId) ?? TUTOR_MODELS[0];
  const providers = [...new Set(TUTOR_MODELS.map((model) => model.provider))];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState
              description="Ask a question about the material in this notebook."
              icon={<BotIcon className="size-6" />}
              title="Start a tutoring session"
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse
                        isAnimating={status === "streaming"}
                        key={`${message.id}-${index}`}
                      >
                        {part.text}
                      </MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PromptInput
          className="rounded-xl bg-background shadow-sm"
          onSubmit={async ({ text }) => {
            const trimmedText = text.trim();
            if (!trimmedText || isBusy) {
              return;
            }

            const isNewThread = messages.length === 0;

            await sendMessage({
              role: "user",
              parts: [{ type: "text", text: trimmedText }],
            });

            if (isNewThread) {
              await router.invalidate();
            }
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              aria-label="Message your tutor"
              disabled={isBusy}
              placeholder="Ask your tutor..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <div className="flex min-w-0 items-center gap-1">
              <ModelSelector onOpenChange={setIsModelSelectorOpen} open={isModelSelectorOpen}>
                <ModelSelectorTrigger asChild>
                  <PromptInputButton
                    aria-label={`Select model. Current model: ${selectedModel.name}`}
                    className="max-w-40"
                    disabled={isBusy}
                  >
                    <ModelSelectorLogo provider={selectedModel.id.split("/")[0]} />
                    <span className="truncate">{selectedModel.name}</span>
                    <ChevronDownIcon className="size-3" />
                  </PromptInputButton>
                </ModelSelectorTrigger>
                <ModelSelectorContent title="Select a tutor model">
                  <ModelSelectorInput placeholder="Search models..." />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                    {providers.map((provider) => (
                      <ModelSelectorGroup heading={provider} key={provider}>
                        {TUTOR_MODELS.filter((model) => model.provider === provider).map(
                          (model) => (
                            <ModelSelectorItem
                              key={model.id}
                              onSelect={() => {
                                setSelectedModelId(model.id);
                                setIsModelSelectorOpen(false);
                              }}
                              value={`${model.provider} ${model.name} ${model.id}`}
                            >
                              <ModelSelectorLogo provider={model.id.split("/")[0]} />
                              <ModelSelectorName>{model.name}</ModelSelectorName>
                              <CheckIcon
                                className={cn(
                                  "size-4",
                                  model.id === selectedModelId ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </ModelSelectorItem>
                          ),
                        )}
                      </ModelSelectorGroup>
                    ))}
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
              <span
                className={cn(
                  "hidden px-2 text-xs text-muted-foreground sm:inline",
                  status === "error" && "text-destructive",
                )}
              >
                {status === "error" ? "Message failed. Try again." : "Enter to send"}
              </span>
            </div>
            <PromptInputSubmit onStop={stop} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
