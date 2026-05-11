import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel/$chatID")({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatID } = Route.useParams();
  return (
    <div>

    </div>
  );
}
