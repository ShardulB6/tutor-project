import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { saveFileSchema, getFiles, deleteFile } from "#/lib/functions/file.functions";
<<<<<<< HEAD
=======
import z from "zod";
>>>>>>> 3b34cdadcc8c1d8ac10b1e54645d79f49a7b9fc8

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel")({
  loader: async ({ params }) => {
    const files = await getFiles({ data: { notebookId: params.notebookID } });
<<<<<<< HEAD

    return { files };
  },
=======
    return { files };
  },
  params: z.object({ notebookID: z.string().brand<"NotebookId">() }),
>>>>>>> 3b34cdadcc8c1d8ac10b1e54645d79f49a7b9fc8

  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="20%" minSize="10%">
        <div className="flex h-24 w-full flex-col items-center justify-center gap-3 px-4">
          <span className="font-semibold">Files</span>
          <input type="file" accept=".pdf" className="block w-full max-w-40 text-sm" />
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
