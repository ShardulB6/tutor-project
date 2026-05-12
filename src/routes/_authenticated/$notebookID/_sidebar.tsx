import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AppSidebar } from "#/components/ChatSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import { createThread, getThreads, deleteThread } from "#/lib/functions/threads.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  loader: async ({ params }) => {
    const threads = await getThreads({ data: { notebookID: params.notebookID } });
    return { threads };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();
  const { threads } = Route.useLoaderData();
  const createNewThread = useServerFn(createThread);
  const deleteThreads = useServerFn(deleteThread)
  const router = useRouter();

  type CreateThreadInput = {
    title: string;
    notebookID: string;
  };

  type DeleteThreadInput = {
    id: string;
  }

  const handleCreateThread = async ({
    title,
    notebookID,
  }: CreateThreadInput): Promise<void> => {
    await createNewThread({
      data: {
        title,
        notebookID,
      },
    });

    await router.load();
  };
  
  const handleDeleteThread = async ({ id }: DeleteThreadInput): Promise<void> => {
    await deleteThreads({
      data: { id },
    });

    await router.load();
  };
  

  return (
    <div>
      <SidebarProvider>
        <AppSidebar
          notebookID={notebookID}
          threads={threads}
          onCreate={handleCreateThread}
          onDelete={handleDeleteThread}
        />
        <main className="flex-1">
          <SidebarInset>
            <div className="absolute left-3 top-3 z-50 flex items-center gap-2">
              <SidebarTrigger />
            </div>
          </SidebarInset>
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
}
