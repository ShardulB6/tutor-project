import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  loader: async ({ params }) => {
    return { threads: [] };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();

  return (
    <div>
      <SidebarProvider>
        <AppSidebar notebookID={notebookID} />
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

type ChatSidebarProps = {
  notebookID: string;
};

export function AppSidebar({ notebookID }: ChatSidebarProps) {
  const { threads } = Route.useLoaderData();
  return (
    <Sidebar>
      <SidebarHeader>
        <div>
          <h3 style={{ margin: 0 }}>{notebookID}</h3>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
