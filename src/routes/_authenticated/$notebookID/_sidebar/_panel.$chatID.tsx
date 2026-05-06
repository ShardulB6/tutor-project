import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel/$chatID")({
  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID, chatID } = Route.useParams();
  return (
    <div>
      Hello "/_authenticated/{notebookID}/_sidebar/{chatID}"!
    </div>
  );
}
