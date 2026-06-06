import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { routeAgentRequest } from "agents";

async function handleAgentRequest(request: Request) {
  return (
    (await routeAgentRequest(request, env)) ?? new Response("Agent not found", { status: 404 })
  );
}
// TODO: add middleware to check if user request owns the notebook
export const Route = createFileRoute("/agents/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAgentRequest(request),
      POST: ({ request }) => handleAgentRequest(request),
    },
  },
});
