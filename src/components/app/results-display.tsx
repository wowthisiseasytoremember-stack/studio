import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileJson, Gem, Tags, DollarSign } from "lucide-react";
import { AnalyzeImageAndExtractMetadataOutput } from "@/ai/flows/analyze-image-and-extract-metadata";

type ResultsDisplayProps = {
  imageDataUrl: string;
  analysis: AnalyzeImageAndExtractMetadataOutput;
};

export function ResultsDisplay({
  imageDataUrl,
  analysis,
}: ResultsDisplayProps) {
    const { descriptiveName, estimatedValueRange, reasoning, comparableSales, tags, otherMetadata } = analysis;

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

                {tags && tags.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Tags className="w-5 h-5 text-primary" />
                                Suggested Tags
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gem className="w-5 h-5 text-primary" />
                            AI Appraisal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center bg-primary/10 p-4 rounded-lg">
                            <p className="text-sm font-medium text-primary/80">Estimated Value</p>
                            <p className="font-bold text-3xl md:text-4xl text-primary">{estimatedValueRange.low} - {estimatedValueRange.high}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Valuation Reasoning</h3>
                            <p className="text-sm text-muted-foreground">{reasoning}</p>
                        </div>
                    </CardContent>
                </Card>

                {comparableSales && comparableSales.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary" />
                                Comparable Sales
                            </CardTitle>
                            <CardDescription>Similar items that have recently sold.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {comparableSales.map((sale, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm border-b pb-2">
                                        <p className="text-muted-foreground pr-4">{sale.description}</p>
                                        <p className="font-bold text-primary whitespace-nowrap">{sale.price}</p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
                
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
