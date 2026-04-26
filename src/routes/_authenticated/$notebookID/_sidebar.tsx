import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/ui/MySpecialUI/ChatSidebar";
import { SidebarProvider } from "#/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();
  return (
    <div>
      <h3>{notebookID}</h3>
      <div className="flex flex-row h-screen">
        <SidebarProvider>
          <AppSidebar />
          <div className="flex-1">
            <Outlet />
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
