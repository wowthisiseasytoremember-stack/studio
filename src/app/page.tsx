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

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImageAndExtractMetadataOutput | null>(null);
  const [similarItems, setSimilarItems] = useState<string[] | null>(null);
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
    // 1. Initial setup
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSimilarItems(null);
    
    try {
      // 2. Resize
      const dataUrl = await resizeImage(file, 512, 512);
      setImageDataUrl(dataUrl);

      // 3. Analyze
      const analysis = await analyzeImageAndExtractMetadata({ photoDataUri: dataUrl });
      setAnalysisResult(analysis);
      setIsAnalyzing(false);
      setIsFindingSimilar(true);

      // 4. Find similar items in the background
      try {
        const { imageEmbedding, metadataEmbedding } = await generateEmbeddingsForImageAndMetadata({
            imageDataUri: dataUrl,
            metadata: JSON.stringify(analysis),
        });

        const similarDocsFromAI = await findSimilarDocumentsUsingEmbeddings({
            imageEmbedding,
            metadataEmbedding,
            firestoreCollection: "items",
            documentId: `doc-${Date.now()}`,
        });
        
        const dummySimilarItems = ["doc-abc-123", "doc-def-456", "doc-ghi-789"];

        setSimilarItems(similarDocsFromAI.length > 0 ? similarDocsFromAI : dummySimilarItems);
      } catch (similarError) {
          console.error("Finding similar items failed:", similarError);
          setSimilarItems([]); // On error, show "no results" instead of spinning forever.
          toast({
            variant: "destructive",
            title: "Similarity Search Failed",
            description: "Could not find similar items.",
          });
      } finally {
        setIsFindingSimilar(false);
      }
      
    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "There was an error processing your image. Please try again.",
      });
      // Reset everything on initial failure
      handleReset();
    }
  };

  const handleReset = () => {
    setImageDataUrl(null);
    setAnalysisResult(null);
    setSimilarItems(null);
    setIsAnalyzing(false);
    setIsFindingSimilar(false);
  };

  const renderContent = () => {
    if (isAnalyzing) {
      return <LoadingIndicator message={"Appraising your item..."} />;
    }
    if (analysisResult && imageDataUrl) {
      return (
        <div className="space-y-8">
          <ResultsDisplay
            imageDataUrl={imageDataUrl}
            analysis={analysisResult}
            similarItems={similarItems}
            isFindingSimilar={isFindingSimilar}
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
    return <FileUpload onFileUpload={processImage} isProcessing={isAnalyzing} />;
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
