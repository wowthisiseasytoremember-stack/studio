import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileJson, Files, Gem, Tags } from "lucide-react";
import { AnalyzeImageAndExtractMetadataOutput } from "@/ai/flows/analyze-image-and-extract-metadata";

type ResultsDisplayProps = {
  imageDataUrl: string;
  analysis: AnalyzeImageAndExtractMetadataOutput;
  similarItems: string[];
};

export function ResultsDisplay({
  imageDataUrl,
  analysis,
  similarItems,
}: ResultsDisplayProps) {
    const { descriptiveName, valuation, reasoning, tags, otherMetadata } = analysis;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in-50 duration-500">
            <div className="space-y-8">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>{descriptiveName || "Uploaded Image"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                            <Image
                                src={imageDataUrl}
                                alt={descriptiveName || "Uploaded content"}
                                fill
                                className="object-contain"
                                data-ai-hint="user uploaded image"
                            />
                        </div>
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

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gem className="w-5 h-5 text-primary" />
                            AI Valuation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-lg">{valuation}</h3>
                            <p className="text-muted-foreground">{reasoning}</p>
                        </div>
                        {tags && tags.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                                    <Tags className="w-4 h-4" />
                                    Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {otherMetadata && otherMetadata.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileJson className="w-5 h-5 text-primary" />
                                Additional Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                {otherMetadata.map(({ key, value }) => (
                                    <div key={key} className="flex justify-between border-b pb-1">
                                        <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                                        <dd className="text-right font-medium">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
