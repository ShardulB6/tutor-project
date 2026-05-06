import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello "/_authenticated/$notebookID/_sidebar/_panel"!
      <Outlet />
    </div>
  );
}
