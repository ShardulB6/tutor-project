import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();
  return (
    <div className="flex flex-row h-screen">
      <div>Hello "/_authenticated/{notebookID}"!</div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
