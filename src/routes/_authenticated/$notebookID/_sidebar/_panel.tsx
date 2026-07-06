import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { getFiles, saveFileSchema } from "#/lib/functions/file.functions";
import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("notebookId", notebookID);

    try {
      await saveFileSchema({ data: formData });
      await router.invalidate();
    } finally {
      input.value = "";
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
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="space-y-1 pb-4">
              {files.map((file) => (
                <li className="break-words" key={file.id}>
                  {file.title}
                </li>
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
