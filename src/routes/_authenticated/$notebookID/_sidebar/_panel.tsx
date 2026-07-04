import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { saveFileSchema, getFiles, deleteFile } from "#/lib/functions/file.functions";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel")({
  loader: async ({ params }) => {
    const files = await getFiles({ data: { notebookId: params.notebookID } });

    return { files };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { files } = Route.useLoaderData();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {};

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="20%" minSize="10%">
        <div className="flex h-24 w-full flex-col items-center justify-center gap-3 px-4">
          <span className="font-semibold">Files</span>
          <input
            type="file"
            accept=".pdf"
            className="block w-full max-w-40 text-sm"
            onChange={handleFileUpload}
          />
          <div>
            <ul>
              {files.map((file) => (
                <li key={file.id}>{file.id}</li>
              ))}
            </ul>
          </div>
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
