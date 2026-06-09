import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import type { NotebookId } from "#/db/schema";
import { getServerNotebook } from "#/lib/functions/notebooks.functions";
import { getServerThreads } from "#/lib/functions/threads.function";
import z from "zod";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  loader: async ({ params }) => {
    const notebook = await getServerNotebook({ data: { id: params.notebookID } });
    const threads = await getServerThreads({ data: { notebookId: params.notebookID } });
    return { notebook, threads };
  },
  params: z.object({ notebookID: z.string().brand<"NotebookId">() }),

  component: RouteComponent,
});

function RouteComponent() {
  const { notebook, threads } = Route.useLoaderData();
  const { notebookID } = Route.useParams();

  return (
    <div>
      <SidebarProvider>
        <AppSidebar notebook={notebook} notebookID={notebookID} threads={threads} />
        <SidebarInset className="h-screen overflow-hidden">
          <div className="absolute left-3 top-3 z-50 flex items-center gap-2">
            <SidebarTrigger />
          </div>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

type ChatSidebarProps = {
  notebook: any; // Replace 'any' with the actual type for your notebook object
  notebookID: NotebookId;
  threads: any; // Replace 'any' with the actual type for your threads object
};

export function AppSidebar({ notebook, notebookID, threads }: ChatSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div>
          <h3 style={{ margin: 0 }}>{notebook.title}</h3>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          {threads.map((thread: any) => (
            <Link
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="block truncate rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              key={thread.sessionID}
              params={{ notebookID, chatID: thread.sessionID }}
              to="/$notebookID/$chatID"
            >
              {thread.sessionID}
            </Link>
          ))}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
