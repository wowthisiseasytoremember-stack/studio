"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { Header } from "@/components/app/header";
import { FileUpload } from "@/components/app/file-upload";
import { ResultsDisplay } from "@/components/app/results-display";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { analyzeImageAndExtractMetadata, AnalyzeImageAndExtractMetadataOutput } from "@/ai/flows/analyze-image-and-extract-metadata";
import { findBundlesInInventory, FindBundlesInInventoryOutput } from "@/ai/flows/find-bundles-in-inventory";
import { Button } from "@/components/ui/button";
import { Sparkles, LoaderCircle, Gem } from "lucide-react";
import NextImage from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type InventoryItem = {
  id: string; // from firestore doc id
  imageDataUrl: string;
  analysis: AnalyzeImageAndExtractMetadataOutput;
  createdAt: { seconds: number, nanoseconds: number }; // firestore timestamp
};

type PendingInventoryItem = {
    id: string; // temporary client-side id
    imageDataUrl: string;
    isLoading: boolean;
};

function InventoryItemCard({ item, onSelect }: { item: InventoryItem | PendingInventoryItem, onSelect: (item: InventoryItem | PendingInventoryItem) => void }) {
    if ('isLoading' in item && item.isLoading) {
        return (
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="relative aspect-square bg-muted flex items-center justify-center">
                        <LoaderCircle className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
                <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </Card>
        );
    }
    
    const analysis = 'analysis' in item ? item.analysis : null;

    return (
        <div onClick={() => onSelect(item)} className="group cursor-pointer">
            <Card className="overflow-hidden flex flex-col h-full transition-shadow duration-200 group-hover:shadow-lg">
                <CardContent className="p-0">
                    <div className="relative aspect-square">
                        <NextImage 
                            src={item.imageDataUrl} 
                            alt={analysis?.descriptiveName || 'Inventory item'} 
                            fill 
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                            data-ai-hint="inventory item"
                        />
                    </div>
                </CardContent>
                {analysis && (
                  <div className="p-3 flex-grow flex flex-col bg-card">
                      <h3 className="font-semibold text-sm flex-grow group-hover:text-primary transition-colors duration-200">{analysis.descriptiveName}</h3>
                      <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                        <Gem className="w-3 h-3" />
                        {analysis.estimatedValueRange.low} - {analysis.estimatedValueRange.high}
                      </p>
                  </div>
                )}
            </Card>
        </div>
    );
}

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();

  const inventoryQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, 'users', user.uid, 'inventory'), orderBy('createdAt', 'desc'));
  }, [user, db]);

  const { data: inventory, loading: inventoryLoading } = useCollection<InventoryItem>(inventoryQuery);
  const [pendingItems, setPendingItems] = useState<PendingInventoryItem[]>([]);
  
  const [bundles, setBundles] = useState<FindBundlesInInventoryOutput | null>(null);
  const [isFindingBundles, setIsFindingBundles] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | PendingInventoryItem | null>(null);
  const { toast } = useToast();

  const combinedInventory = useMemo(() => {
    return [...pendingItems, ...(inventory || [])];
  }, [pendingItems, inventory]);

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
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to add items."});
        return;
    }
    setIsPreparingImage(true);
    let dataUrl: string;
    try {
      dataUrl = await resizeImage(file, 512, 512);
    } catch (error) {
      console.error("Image resize failed:", error);
      toast({
        variant: "destructive",
        title: "Image Error",
        description: "There was an error preparing your image. Please try another file.",
      });
      setIsPreparingImage(false);
      return;
    }
    setIsPreparingImage(false);
    
    const newItemId = `${Date.now()}-${Math.random()}`;
    const newItem: PendingInventoryItem = {
      id: newItemId,
      imageDataUrl: dataUrl,
      isLoading: true,
    };
    
    setPendingItems(prev => [newItem, ...prev]);

    try {
      const analysis = await analyzeImageAndExtractMetadata({ photoDataUri: dataUrl });
      
      const itemData = {
          imageDataUrl: dataUrl,
          analysis,
          createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'users', user.uid, 'inventory'), itemData);

      // The useCollection hook will automatically update the inventory.
      // We just need to remove the item from the pending list.
      setPendingItems(prev => prev.filter(p => p.id !== newItemId));

    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "There was an error processing your image. Please try again.",
      });
      setPendingItems(prev => prev.filter(p => p.id !== newItemId));
    }
  };
  
  const handleFindBundles = async () => {
    const readyItems = inventory?.filter(item => 'analysis' in item);
    if (!readyItems || readyItems.length < 2) {
      toast({
        title: "Not enough items",
        description: "Please upload and analyze at least two items to find bundles.",
      });
      return;
    }
    setIsFindingBundles(true);
    setBundles(null);
    try {
      const inventoryForAI = readyItems.map(item => item.analysis);
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

  const handleSelectItem = (item: InventoryItem | PendingInventoryItem) => {
    if ('isLoading' in item && item.isLoading) return;
    setSelectedItem(item);
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
  };

  const hasItems = combinedInventory.length > 0;
  const readyItemCount = inventory?.length || 0;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="space-y-12">
            <FileUpload onFileUpload={processImage} isProcessing={isPreparingImage} />
            
            {hasItems && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle>Your Inventory ({readyItemCount} items)</CardTitle>
                        <CardDescription>This is your collection of appraised items. When you're ready, find bundles!</CardDescription>
                    </div>
                    <Button onClick={handleFindBundles} disabled={isFindingBundles || readyItemCount < 2} className="mt-4 sm:mt-0 shrink-0">
                      {isFindingBundles ? (
                        <LoaderCircle className="mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2" />
                      )}
                      {isFindingBundles ? "Finding Bundles..." : `Find Product Bundles`}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {combinedInventory.map((item) => (
                      <InventoryItemCard key={item.id} item={item} onSelect={handleSelectItem} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {inventoryLoading && !hasItems && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0"><div className="relative aspect-square bg-muted"></div></CardContent>
                    <div className="p-3 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/2" /></div>
                  </Card>
                ))}
              </div>
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
                    {bundles && bundles.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No potential bundles found in your current inventory.</p>
                    )}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setBundles(null)}>Great, thanks!</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                     <DialogHeader>
                        <DialogTitle>{(selectedItem && 'analysis' in selectedItem) ? selectedItem.analysis.descriptiveName : "Item Details"}</DialogTitle>
                     </DialogHeader>
                     <div className="overflow-y-auto pr-6 -mr-6">
                        {selectedItem && 'analysis' in selectedItem && (
                            <ResultsDisplay 
                                imageDataUrl={selectedItem.imageDataUrl}
                                analysis={selectedItem.analysis}
                            />
                        )}
                     </div>
                </DialogContent>
            </Dialog>
          </div>
      </main>
      <Toaster />
    </div>
  );
}
