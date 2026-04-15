import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerNotebook, getServerNotebooks } from "#/lib/functions/notebooks.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/")({
  loader: async () => {
    const notebooks = await getServerNotebooks();

    return { notebooks };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { notebooks } = Route.useLoaderData();
  const router = useRouter();
  const createNotebook = useServerFn(createServerNotebook);

  return (
    <div className="p-4">
      <div>
        <h1 className="text-2xl font-bold">Notebooks</h1>
        <button
          onClick={async () => {
            await createNotebook({
              data: {
                title: "New Notebook",
              },
            });
            await router.load();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        >
          Create Notebook
        </button>
      </div>
      <ul>
        {notebooks.map((notebook) => (
          <li key={notebook.id}>
            <div className="border rounded-sm mb-4 mt-4 w-30 h-30">
              <h2 className="text-lg font-semibold">{notebook.title}</h2>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
