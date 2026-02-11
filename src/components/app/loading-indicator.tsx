import { LoaderCircle } from "lucide-react";

type LoadingIndicatorProps = {
    message?: string;
}

export function LoadingIndicator({ message = "Analyzing Image..." }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center h-full py-20 animate-in fade-in-50 duration-500">
      <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
      <div>
        <h2 className="font-headline text-2xl font-semibold">{message}</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Our AI is working its magic. This might take a moment.
        </p>
      </div>
    </div>
  );
}
