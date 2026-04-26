import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  createServerNotebook,
  deleteServerNotebook,
  getServerNotebooks,
} from "#/lib/functions/notebooks.functions";
import { useServerFn } from "@tanstack/react-start";
import { DialogDemo } from "@/components/ui/MySpecialUI/PopUpCreateNotebook";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/")({
  loader: async () => {
    const notebooks = await getServerNotebooks();

    return { notebooks };
  },

  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-4 gap-4 mx-auto">
      <div>
        <h1 className="text-2xl mx-auto font-bold">Notebooks</h1>
        <CreateNotebookComponent />
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
        <NotebookCard key={notebook.id} notebook={notebook} />
      ))}
    </div>
  );
};

const CreateNotebookComponent = () => {
  const createNotebook = useServerFn(createServerNotebook);
  const router = useRouter();

  return (
    <DialogDemo
      onCreate={async ({ title }) => {
        await createNotebook({
          data: {
            title,
          },
        });
        await router.load();
      }}
    />
  );
};

export function NotebookCard({
  notebook,
}: {
  notebook: Awaited<ReturnType<typeof getServerNotebooks>>[number];
}) {
  const router = useRouter();
  const deleteNotebook = useServerFn(deleteServerNotebook);
  return (
    <Card className="relative mx-autow-full max-w-sm border-0 pt-0 shadow-none ">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={"https://avatar.vercel.sh/shadcn1"}
        alt={notebook.title}
        className="relative z-20 aspect-video w-full rounded-t-lg object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction></CardAction>
        <CardTitle className="truncate">{notebook.title}</CardTitle>
        <CardDescription>Created on {notebook.createdAt?.toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() =>
            router.navigate({
              to: "/$notebookID",
              params: { notebookID: notebook.id },
            })
          }
        >
          View Notebook
        </Button>
        <Button
          className="w-full"
          variant="destructive"
          onClick={async () => {
            await deleteNotebook({ data: { id: notebook.id } });
            await router.load();
          }}
        >
          Delete Notebook
        </Button>
      </CardFooter>
    </Card>
  );
}
