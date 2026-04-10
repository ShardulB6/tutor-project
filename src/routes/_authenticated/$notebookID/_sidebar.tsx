import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();
  return (
    <div>
      <div>Hello "/_authenticated/{notebookID}"!</div>
      {/* <Outlet /> */}
    </div>
  );
}
