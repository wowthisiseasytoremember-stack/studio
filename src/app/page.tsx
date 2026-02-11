"use client";

import { useState } from "react";
import { Header } from "@/components/app/header";
import { FileUpload } from "@/components/app/file-upload";
import { ResultsDisplay } from "@/components/app/results-display";
import { LoadingIndicator } from "@/components/app/loading-indicator";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { analyzeImageAndExtractMetadata } from "@/ai/flows/analyze-image-and-extract-metadata";
import { generateEmbeddingsForImageAndMetadata } from "@/ai/flows/generate-embeddings-for-image-and-metadata";
import { findSimilarDocumentsUsingEmbeddings } from "@/ai/flows/find-similar-documents-using-embeddings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Results = {
  metadata: Record<string, any>;
  similarItems: string[];
};

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const { toast } = useToast();

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setResults(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        setImageDataUrl(dataUrl);

        // Step 1: Analyze Image and Extract Metadata
        const { metadata } = await analyzeImageAndExtractMetadata({ photoDataUri: dataUrl });

        // Step 2: Generate Embeddings
        const { imageEmbedding, metadataEmbedding } = await generateEmbeddingsForImageAndMetadata({
          imageDataUri: dataUrl,
          metadata: JSON.stringify(metadata),
        });

        // Step 3: Find Similar Documents
        // The mock flow returns an empty array, so we'll add dummy data for demonstration.
        const similarDocsFromAI = await findSimilarDocumentsUsingEmbeddings({
          imageEmbedding,
          metadataEmbedding,
          firestoreCollection: "items",
          documentId: `doc-${Date.now()}`,
        });
        
        const dummySimilarItems = ["doc-abc-123", "doc-def-456", "doc-ghi-789"];

        setResults({ 
            metadata, 
            similarItems: similarDocsFromAI.length > 0 ? similarDocsFromAI : dummySimilarItems
        });
        
      } catch (error) {
        console.error("Processing failed:", error);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "There was an error processing your image. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
        console.error("Failed to read file");
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the selected file.",
        });
        setIsProcessing(false);
    };
  };

  const handleReset = () => {
    setImageDataUrl(null);
    setResults(null);
    setIsProcessing(false);
  };

  const renderContent = () => {
    if (isProcessing) {
      return <LoadingIndicator />;
    }
    if (results && imageDataUrl) {
      return (
        <div className="space-y-8">
          <ResultsDisplay
            imageDataUrl={imageDataUrl}
            metadata={results.metadata}
            similarItems={results.similarItems}
          />
          <div className="text-center">
            <Button size="lg" onClick={handleReset}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Analyze Another Image
            </Button>
          </div>
        </div>
      );
    }
    return <FileUpload onFileUpload={processImage} isProcessing={isProcessing} />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Toaster />
    </div>
  );
}
