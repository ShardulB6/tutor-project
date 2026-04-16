import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerNotebook, getServerNotebooks } from "#/lib/functions/notebooks.functions";
import { useServerFn } from "@tanstack/react-start";
import { CardImage } from "@/components/ui/MySpecialUI/NotebookCard";

export const Route = createFileRoute("/_authenticated/")({
  loader: async () => {
    const notebooks = await getServerNotebooks();

    return { notebooks };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const createNotebook = useServerFn(createServerNotebook);

  return (
    <div className="p-4 gap-4 mx-auto">
      <div>
        <h1 className="text-2xl mx-auto font-bold">Notebooks</h1>
        <button
          onClick={async () => {
            await createNotebook({
              data: {
                title:
                  "New Notebookdsfdsfsdfsdfsdfsdfsdfsdfsdfsdsadfsdfsdfsdxcvzsefvgrbvfdthbfgbvbctbcv",
              },
            });
            await router.load();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        >
          Create Notebook
        </button>
      </div>
      <NotebooksComponent />
    </div>
  );
}

const NotebooksComponent = () => {
  const { notebooks } = Route.useLoaderData();

  return (
    <div className="flex flex-row gap-4 flex-wrap mt-6 ">
      {notebooks.map((notebook) => (
        <CardImage
          key={notebook.id}
          title={notebook.title}
          imageSrc={"https://avatar.vercel.sh/shadcn1"}
          dateCreated={notebook.createdAt ? notebook.createdAt.toLocaleDateString() : "Unknown"}
        />
      ))}
    </div>
  );
};
