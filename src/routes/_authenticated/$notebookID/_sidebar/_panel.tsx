import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="20%" minSize="10%">
        <div className="flex h-20 items-center justify-center p-6">
          <span className="font-semibold">Files</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="h-screen" defaultSize="60%" minSize="40%">
        <Outlet />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="20%" minSize="10%">
        <div className="flex h-20 items-center justify-center p-6">
          <span className="font-semibold">JSON</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
