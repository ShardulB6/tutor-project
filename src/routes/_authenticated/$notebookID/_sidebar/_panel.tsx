import { useRef } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { cn } from "#/lib/utils";
import { useChat } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";

import { Example } from "@/components/ModelPicker";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="20%">
        <div className="flex h-20 items-center justify-center p-6">
          <span className="font-semibold">Files</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="60%">
        <div className="flex h-full flex-col px-3">
          <div className="flex-1">
            <Chat />
            <Outlet />
          </div>
          <div className="py-3">
            <EnterBar />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="20%">
        <div className="flex h-20 items-center justify-center p-6">
          <span className="font-semibold">JSON</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function EnterBar(props: { className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <form className={cn("flex w-full flex-col gap-2", props.className)} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none w-full"
        type="text"
        placeholder="Enter text"
      />
      <div className="flex">
        <Example />
        <button
          className="h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ml-auto"
          type="submit"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

function Chat() {
  const { messages, status } = useChat();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, index) =>
            part.type === "text" ? (
              <Streamdown
                key={index}
                plugins={{ code, mermaid, math, cjk }}
                isAnimating={status === "streaming"}
              >
                {part.text}
              </Streamdown>
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
}
