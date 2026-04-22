import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PopUpCreateNotebookProps = {
  onCreate: (data: { title: string }) => void | Promise<void>;
};

export function DialogDemo({ onCreate }: PopUpCreateNotebookProps) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();

    if (!title) return;

    await onCreate({ title });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Open Dialog
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Notebook</DialogTitle>
            <DialogDescription>Enter a title for your new notebook.</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue="New Notebook" />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit">Create Notebook</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
