import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "#/components/ChatSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import {
  createThread, 
  deleteThread,
  getThreads,
  updateThread,
} from "#/lib/functions/threads.functions";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        <SidebarInset>
          <h3>{notebookID}</h3>
          <Outlet />
        </SidebarInset>
      </main>
    </SidebarProvider>
  );
}
