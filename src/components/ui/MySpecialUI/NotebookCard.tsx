import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CardImageProps = {
  title: string;
  description?: string;
  imageSrc?: string;
  dateCreated: string;
};

export function CardImage({ title, imageSrc, dateCreated }: CardImageProps) {
  return (
    <Card className="relative mx-autow-full max-w-sm border-0 pt-0 shadow-none ">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={imageSrc}
        alt={title}
        className="relative z-20 aspect-video w-full rounded-t-lg object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction></CardAction>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Created on {dateCreated}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full">Open Notebook</Button>
        <Button className="w-full">Delete Notebook</Button>
      </CardFooter>
    </Card>
  );
}
