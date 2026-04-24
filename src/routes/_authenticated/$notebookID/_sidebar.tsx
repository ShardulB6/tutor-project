import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$notebookID/_sidebar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { notebookID } = Route.useParams();
  return (
    <div>
      <h3>{notebookID}</h3>
      <div className="flex flex-row h-screen">
        <div className="box-border size-32 border-4 p-4 m-4 h-auto">

        </div>
        <div className="box-border size-32 border-4 p-4 m-4 h-auto">
          
        </div>
        <div className="box-border size-32 border-4 p-4 m-4 h-auto">

        </div>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
