"use client";

import { useAgentChat } from "@cloudflare/ai-chat/react";
import { useRouter } from "@tanstack/react-router";
import { useAgent } from "agents/react";
import { BotIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "#/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "#/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "#/components/ai-elements/prompt-input";
import { cn } from "#/lib/utils";

type TutorChatProps = {
  notebookID: string;
  sessionID: string;
};

export function TutorChat({ notebookID, sessionID }: TutorChatProps) {
  const router = useRouter();
  const agent = useAgent({
    agent: "TutorAgent",
    name: `${notebookID}:${sessionID}`,
  });
  const { messages, sendMessage, status, stop } = useAgentChat({ agent });
  const isBusy = status === "submitted" || status === "streaming";

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
            <span
              className={cn(
                "px-2 text-xs text-muted-foreground",
                status === "error" && "text-destructive",
              )}
            >
              {status === "error" ? "Message failed. Try again." : "Enter to send"}
            </span>
            <PromptInputSubmit onStop={stop} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
