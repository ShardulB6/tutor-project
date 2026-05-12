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
import { Link } from "@tanstack/react-router";
import type { getThreads } from "#/lib/functions/threads.functions";

type ChatSidebarProps = {
  notebookID: string;
  threads: Awaited<ReturnType<typeof getThreads>>;
  onCreate: (data: { title: string; notebookID: string }) => void | Promise<void>;
};

export function AppSidebar({ notebookID, threads, onCreate }: ChatSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div>
          <h3 style={{ margin: 0 }}>{notebookID}</h3>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuButton onClick={() => onCreate({ title: "New Thread", notebookID })}>
                New Thread
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.map((thread) => (
                <SidebarMenuItem key={thread.id}>
                  <SidebarMenuButton asChild>
                    <Link to="/$notebookID/$chatID" params={{ notebookID, chatID: thread.id }}>
                      {thread.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
