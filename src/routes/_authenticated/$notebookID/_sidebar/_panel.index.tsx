import { createFileRoute } from "@tanstack/react-router";
import { TutorChat } from "#/components/TutorChat";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();

  return <TutorChat notebookID={notebookID} sessionID={notebookID} />;
}
