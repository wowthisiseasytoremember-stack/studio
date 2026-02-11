import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileJson, Files } from "lucide-react";

type ResultsDisplayProps = {
  imageDataUrl: string;
  metadata: Record<string, any>;
  similarItems: string[];
};

export function ResultsDisplay({
  imageDataUrl,
  metadata,
  similarItems,
}: ResultsDisplayProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in-50 duration-500">
      <div className="space-y-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Uploaded Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
              <Image
                src={imageDataUrl}
                alt="Uploaded content"
                fill
                className="object-contain"
                data-ai-hint="user uploaded image"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary" />
              Extracted Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="w-full bg-secondary/30 p-4 rounded-lg text-sm overflow-x-auto">
              <code className="font-code text-foreground/90">
                {JSON.stringify(metadata, null, 2)}
              </code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Files className="w-5 h-5 text-primary" />
              Suggested Similar Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {similarItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {similarItems.map((id) => (
                  <Badge key={id} variant="secondary" className="font-mono">
                    {id}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No similar items found in the database.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
