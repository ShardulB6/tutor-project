import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { InputDemo } from "@/components/promptInput";

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
        <div className="flex h-30 px-3 py-6">
          <InputDemo />
          <Outlet />
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
