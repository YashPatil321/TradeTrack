// components/ImageUploader.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageUploadedAction: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
}

// Note: using default export here
export default function ImageUploader({ onImageUploadedAction, currentImage, className = '' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Clean up any existing preview URL
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  }, [preview]);

  useEffect(() => {
    // Set initial preview from currentImage
    if (currentImage) {
      setPreview(currentImage);
    }
  }, [currentImage]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Reset error state
    setError(null);
    
    // Only process the first file
    const file = acceptedFiles[0];
    if (!file) return;

    // Clean up any existing preview
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    // Create a new preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setFile(file);

    // Start uploading
    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', file.name);
      
      // Send the request to the new endpoint
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Upload result:', result);

      if (!result.success) {
        setError(result.error || 'Upload failed');
        return;
      }

      // Call the callback with the URL
      onImageUploadedAction(result.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  }, [onImageUploadedAction]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition duration-300 ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="text-center">
            <div className="relative w-full h-48">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-md"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? 'Drop to replace image' : 'Click or drag to replace image'}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? 'Drop the image here' : 'Drag and drop an image, or click to select'}
            </p>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF up to 5MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Show current image info if applicable */}
      {currentImage && !isUploading && (
        <div className="mt-2 text-xs text-gray-500">
          Current image will be used if no new image is uploaded
        </div>
      )}
    </div>
  );
}