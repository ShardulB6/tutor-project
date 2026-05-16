"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";

import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import type { NotebookId, ThreadId } from "#/db/schema";
import { useEffect, useState } from "react";

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};

const models = [
  { id: "openai/gpt-oss-120b", name: "GPT-oss-120b" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
];

type PromptInputDemoProps = {
  CreateThreadMessage: (data: { message: string; AIModelName: string; notebookID: NotebookId }) => void | Promise<void>;
  CreateMessage: (data: { message: string; AIModelName: string; threadID: ThreadId }) => void | Promise<void>;
  notebookID: NotebookId;
  GetMessages?: (data: { threadID: ThreadId }) => Promise<ChatMessage[]>;
  chatID?: ThreadId;
};

type ChatMessage = {
  id: string;
  roles: string;
  message: string;
  threadID: ThreadId;
  createdAt: Date;
  updatedAt: Date;
};

export const InputDemo = ({ CreateThreadMessage, CreateMessage, GetMessages, chatID, notebookID }: PromptInputDemoProps) => {
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!chatID || !GetMessages) {
      setMessages([]);
      return;
    }

    let isCurrent = true;

    void GetMessages({ threadID: chatID })
      .then((nextMessages) => {
        if (isCurrent) {
          setMessages(nextMessages);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setMessages([]);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [GetMessages, chatID]);


  const {status} = useChat();

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    } else if (!chatID) {
      await CreateThreadMessage({
        message: text,
        AIModelName: model,
        notebookID,
      });
    } else {
      await CreateMessage({
        message: text,
        AIModelName: model,
        threadID: chatID,
      });

      if (GetMessages) {
        const nextMessages = await GetMessages({ threadID: chatID });
        setMessages(nextMessages);
      }
    }
    
  };

  return (
    <div className="max-w mx-auto p-6 relative size-full rounded-lg border h-245">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message key={message.id} from={message.roles === "assistant" ? "assistant" : "user"}>
                <MessageContent>
                  <p>{message.message}</p>
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachmentsDisplay />
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea onChange={(e) => setText(e.target.value)} value={text} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                  <PromptInputActionAddScreenshot />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default InputDemo;
