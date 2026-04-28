import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"

type ChatSidebarProps = {
  threads: () => void | Promise<void>;
}

export function AppSidebar({ threads }: ChatSidebarProps) {
  return (
    <Sidebar className="text-center">
      Cats and dogs
      <SidebarHeader />
      
      <SidebarContent >

        <SidebarGroup />
          
        <SidebarGroup />

      </SidebarContent >

      <SidebarFooter />
    </Sidebar>
  )
}