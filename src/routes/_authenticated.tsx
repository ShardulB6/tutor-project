import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/functions/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    return { user: session.user };
  },
});

function RouteComponent() {
  return <div>Hello "/_authenticated"!</div>;
}
