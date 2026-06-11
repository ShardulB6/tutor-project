import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NotebookId } from "#/db/schema";
import { getServerNotebook } from "#/lib/functions/notebooks.functions";
import { deleteServerThread, getServerThreads } from "#/lib/functions/threads.function";
import { useServerFn } from "@tanstack/react-start";
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
  const router = useRouter();
  const deleteThread = useServerFn(deleteServerThread);

  return (
    <Sidebar>
      <SidebarHeader>
        <div>
          <h3 style={{ margin: 0 }}>{notebook.title}</h3>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild variant="outline">
              <Link params={{ notebookID }} reloadDocument to="/$notebookID">
                <PlusIcon />
                <span>New Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <div className="space-y-1">
            {threads.map((thread: any) => (
              <div
                className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                key={thread.sessionID}
              >
                <Link
                  activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-sm"
                  params={{ notebookID, chatID: thread.sessionID }}
                  reloadDocument
                  to="/$notebookID/$chatID"
                >
                  {thread.sessionID}
                </Link>
                <Button
                  aria-label={`Delete thread ${thread.sessionID}`}
                  className="shrink-0"
                  size="icon-xs"
                  variant="ghost"
                  onClick={async () => {
                    const isCurrentThread = window.location.pathname.endsWith(
                      `/${thread.sessionID}`,
                    );

                    await deleteThread({
                      data: {
                        notebookId: notebookID,
                        sessionId: thread.sessionID,
                      },
                    });

                    if (isCurrentThread) {
                      await router.navigate({
                        params: { notebookID },
                        to: "/$notebookID",
                      });
                    }

                    await router.load();
                  }}
                  title="Delete thread"
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
