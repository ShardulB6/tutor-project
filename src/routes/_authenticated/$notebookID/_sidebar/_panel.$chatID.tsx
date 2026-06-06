import { createFileRoute } from "@tanstack/react-router";
import { TutorChat } from "#/routes/_authenticated/$notebookID/_sidebar/-component/TutorChat";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar/_panel/$chatID")({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatID, notebookID } = Route.useParams();

  return <TutorChat notebookID={notebookID} sessionID={chatID} />;
}
