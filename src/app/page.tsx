"use client";

import { useState } from "react";
import { Header } from "@/components/app/header";
import { FileUpload } from "@/components/app/file-upload";
import { ResultsDisplay } from "@/components/app/results-display";
import { LoadingIndicator } from "@/components/app/loading-indicator";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { analyzeImageAndExtractMetadata, AnalyzeImageAndExtractMetadataOutput } from "@/ai/flows/analyze-image-and-extract-metadata";
import { generateEmbeddingsForImageAndMetadata } from "@/ai/flows/generate-embeddings-for-image-and-metadata";
import { findSimilarDocumentsUsingEmbeddings } from "@/ai/flows/find-similar-documents-using-embeddings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Results = {
  analysis: AnalyzeImageAndExtractMetadataOutput;
  similarItems: string[];
};

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Analyzing Image...");
  const [results, setResults] = useState<Results | null>(null);
  const { toast } = useToast();

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        if (!event.target?.result) {
            return reject(new Error("Could not read image from file."));
        }
        img.src = event.target.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not get canvas context'));
          }
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL(file.type));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setResults(null);

    try {
      setProcessingMessage("Preparing your image...");
      const dataUrl = await resizeImage(file, 512, 512);
      setImageDataUrl(dataUrl);

      // Step 1: Analyze Image and Extract Metadata
      setProcessingMessage("Appraising your item...");
      const analysisResult = await analyzeImageAndExtractMetadata({ photoDataUri: dataUrl });

      // Step 2: Generate Embeddings
      setProcessingMessage("Cataloging details...");
      const { imageEmbedding, metadataEmbedding } = await generateEmbeddingsForImageAndMetadata({
        imageDataUri: dataUrl,
        metadata: JSON.stringify(analysisResult),
      });

      // Step 3: Find Similar Documents
      setProcessingMessage("Checking for similar items...");
      // The mock flow returns an empty array, so we'll add dummy data for demonstration.
      const similarDocsFromAI = await findSimilarDocumentsUsingEmbeddings({
        imageEmbedding,
        metadataEmbedding,
        firestoreCollection: "items",
        documentId: `doc-${Date.now()}`,
      });
      
      const dummySimilarItems = ["doc-abc-123", "doc-def-456", "doc-ghi-789"];

      setResults({ 
          analysis: analysisResult, 
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

  const handleReset = () => {
    setImageDataUrl(null);
    setResults(null);
    setIsProcessing(false);
  };

  const renderContent = () => {
    if (isProcessing) {
      return <LoadingIndicator message={processingMessage} />;
    }
    if (results && imageDataUrl) {
      return (
        <div className="space-y-8">
          <ResultsDisplay
            imageDataUrl={imageDataUrl}
            analysis={results.analysis}
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
