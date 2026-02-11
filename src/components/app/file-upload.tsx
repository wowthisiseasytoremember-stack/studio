"use client";

import { useRef } from "react";
import { UploadCloud, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileUploadProps = {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
};

export function FileUpload({ onFileUpload, isProcessing }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileUpload(event.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 md:py-24 text-center animate-in fade-in-50 duration-500">
      <div className="space-y-2">
        <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
          Unlock Insights from Your Images
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload an image to automatically extract structured metadata, generate embeddings, and find similar items in your database.
        </p>
      </div>
      
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        disabled={isProcessing}
      />
      
      <Button 
        size="lg" 
        onClick={handleUploadClick}
        disabled={isProcessing}
        className="font-semibold"
      >
        {isProcessing ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {isProcessing ? "Processing..." : "Upload Image"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Supports: JPEG, PNG, GIF, WEBP
      </p>
    </div>
  );
}
