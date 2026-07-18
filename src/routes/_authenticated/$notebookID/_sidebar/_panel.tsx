import { Button } from "#/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { deleteFile, getFiles, saveFileSchema } from "#/lib/functions/file.functions";
import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel")({
  loader: async ({ params }) => {
    const files = await getFiles({ data: { notebookId: params.notebookID } });

    return { files };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { files } = Route.useLoaderData();
  const { notebookID } = Route.useParams();
  const router = useRouter();
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("notebookId", notebookID);

    try {
      await saveFileSchema({ data: formData });
      await router.invalidate();
    } finally {
      input.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileIds((currentFileIds) => [...currentFileIds, fileId]);

    try {
      await deleteFile({ data: { notebookId: notebookID, fileId } });
      await router.invalidate();
    } finally {
      setDeletingFileIds((currentFileIds) =>
        currentFileIds.filter((currentFileId) => currentFileId !== fileId),
      );
    }
  };

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="20%" minSize="10%">
        <div className="flex h-full min-h-0 w-full flex-col px-4">
          <div className="flex shrink-0 flex-col items-center gap-3 py-4">
            <span className="font-semibold">Files</span>
            <input
              type="file"
              accept=".pdf"
              className="block w-full max-w-40 text-sm"
              onChange={handleFileUpload}
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {files.map((file) => (
              <li key={file.id}>
                <div className="flex items-start gap-2 rounded-md p-2 text-sm">
                  <span className="wrap-break-word min-w-0 flex-1">{file.title}</span>
                  <Button
                    aria-label="Delete file"
                    disabled={deletingFileIds.includes(file.id)}
                    onClick={() => handleDeleteFile(file.id)}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
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
