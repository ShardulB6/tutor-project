import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "#/components/ChatSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import { getThreads } from "#/lib/functions/threads.functions";

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
  return (
    <div>
      <SidebarProvider>
        <AppSidebar notebookID={notebookID} threads={threads} />
        <main>
          <SidebarInset>
            <div className="absolute left-3 top-3 z-50 flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="mt-10">
              <Outlet />
            </div>
          </SidebarInset>
        </main>
      </SidebarProvider>
    </div>
  );
}
