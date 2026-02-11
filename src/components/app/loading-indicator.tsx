import { LoaderCircle } from "lucide-react";

export function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center h-full py-20 animate-in fade-in-50 duration-500">
      <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
      <div>
        <h2 className="font-headline text-2xl font-semibold">Analyzing Image...</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Our AI is extracting metadata and finding similar items. This might take a moment.
        </p>
      </div>
    </div>
  );
}
