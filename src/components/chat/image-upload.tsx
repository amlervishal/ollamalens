"use client";

import { X, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Attachment } from "@/types";
// Using regular img tag for data URLs since Next.js Image doesn't handle data URLs well

interface ImageUploadProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  onAdd: (files: FileList) => void;
}

export function ImageUpload({
  attachments,
  onRemove,
  onAdd,
}: ImageUploadProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAdd(files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("file-upload")?.click()}
          className="text-xs"
        >
          <ImageIcon className="mr-2 h-3.5 w-3.5" />
          Add Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("file-upload-doc")?.click()}
          className="text-xs"
        >
          <File className="mr-2 h-3.5 w-3.5" />
          Add File
        </Button>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          id="file-upload-doc"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group border rounded-md overflow-hidden bg-background"
            >
              {attachment.type === "image" ? (
                <div className="relative w-24 h-24">
                  <img
                    src={attachment.data}
                    alt={attachment.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(attachment.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="p-3 w-32">
                  <File className="h-6 w-6 mb-1 text-muted-foreground" />
                  <p className="text-xs truncate font-medium">
                    {attachment.name}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(attachment.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

