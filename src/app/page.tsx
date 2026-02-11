"use client";

import { useState } from "react";
import { Header } from "@/components/app/header";
import { FileUpload } from "@/components/app/file-upload";
import { ResultsDisplay } from "@/components/app/results-display";
import { LoadingIndicator } from "@/components/app/loading-indicator";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { analyzeImageAndExtractMetadata, AnalyzeImageAndExtractMetadataOutput } from "@/ai/flows/analyze-image-and-extract-metadata";
import { findBundlesInInventory, FindBundlesInInventoryOutput } from "@/ai/flows/find-bundles-in-inventory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type InventoryItem = {
  imageDataUrl: string;
  analysis: AnalyzeImageAndExtractMetadataOutput;
};

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImageAndExtractMetadataOutput | null>(null);
  const { toast } = useToast();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [bundles, setBundles] = useState<FindBundlesInInventoryOutput | null>(null);
  const [isFindingBundles, setIsFindingBundles] = useState(false);


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
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const dataUrl = await resizeImage(file, 512, 512);
      setImageDataUrl(dataUrl);

      const analysis = await analyzeImageAndExtractMetadata({ photoDataUri: dataUrl });
      setAnalysisResult(analysis);
      setInventory(prev => [...prev, { imageDataUrl: dataUrl, analysis }]);
      
    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "There was an error processing your image. Please try again.",
      });
      handleAnalyzeAnother();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeAnother = () => {
    setImageDataUrl(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };
  
  const handleFindBundles = async () => {
    if (inventory.length < 2) {
      toast({
        variant: "default",
        title: "Not enough items",
        description: "Please upload at least two items to find bundles.",
      });
      return;
    }
    setIsFindingBundles(true);
    setBundles(null);
    try {
      const inventoryForAI = inventory.map(item => item.analysis);
      const result = await findBundlesInInventory(inventoryForAI);
      setBundles(result);
    } catch (error) {
      console.error("Finding bundles failed:", error);
      toast({
        variant: "destructive",
        title: "Bundling Failed",
        description: "There was an error creating bundles. Please try again.",
      });
    } finally {
      setIsFindingBundles(false);
    }
  }

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
          />
          <div className="text-center">
            <Button size="lg" onClick={handleAnalyzeAnother}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Analyze Another Image
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-12">
        <FileUpload onFileUpload={processImage} isProcessing={isAnalyzing} />
        
        {inventory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Your Inventory ({inventory.length} items)</CardTitle>
                <Button onClick={handleFindBundles} disabled={isFindingBundles || inventory.length < 2} className="mt-4 sm:mt-0">
                  {isFindingBundles ? (
                    <LoaderCircle className="mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2" />
                  )}
                  {isFindingBundles ? "Finding Bundles..." : "Find Product Bundles"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {inventory.map((item, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image 
                      src={item.imageDataUrl} 
                      alt={item.analysis.descriptiveName} 
                      fill 
                      className="object-cover" 
                      data-ai-hint="inventory item"
                    />
                     <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-xs truncate">
                        {item.analysis.descriptiveName}
                      </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={!!bundles} onOpenChange={(open) => !open && setBundles(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Sparkles className="text-primary"/>
                  Suggested Product Bundles
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Our AI has identified these bundling opportunities to increase sales.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                {bundles?.map((bundle, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-secondary/50">
                    <h3 className="font-bold text-lg text-primary">{bundle.bundleName}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">{bundle.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {bundle.itemNames.map((name, i) => (
                        <span key={i} className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">{name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setBundles(null)}>Great, thanks!</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    );
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
