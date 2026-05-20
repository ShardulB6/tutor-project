import { useRef } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { cn } from "#/lib/utils";

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
    <form className={cn("flex w-full items-center gap-2", props.className)} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
        type="text"
        placeholder="Enter text"
      />
      <button
        className="h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="submit"
      >
        Submit
      </button>
    </form>
  );
}
