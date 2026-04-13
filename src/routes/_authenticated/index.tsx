import { createFileRoute } from "@tanstack/react-router";
import { createNotebook } from "#/lib/functions/notebooks.functions";


export const Route = createFileRoute("/_authenticated/")({
  component: RouteComponent,
});

function RouteComponent() {


  return (
    <div className="p-4">
      <div>
        <h1 className="text-2xl font-bold">Notebooks</h1>
        <button
          onClick={() => {
            alert("Create notebook");
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Notebook
        </button>
      </div>
      <div>
        <div className="border rounded-sm mb-4 mt-4 w-30 h-30">
          <h3 className="text-lg font-semibold">Notebook Title</h3>
        </div>
      </div>
    </div>
  );
}
