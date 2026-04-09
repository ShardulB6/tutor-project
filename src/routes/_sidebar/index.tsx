import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_sidebar/")({ component: App });

function App() {
  return (
    <div>
      <div>File drop off and file deletion</div>

      <div>Chat interface</div>

      <div>generate flashcards and etc</div>
    </div>
  );
}
