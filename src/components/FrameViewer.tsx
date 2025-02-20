import React from 'react';

interface Frame {
  _id: string;
  imageUrl: string;
  category: string;
  keywords: string[];
  text: string;
  timestamp: string;
}

interface FrameViewerProps {
  frame: Frame;
}

export function FrameViewer({ frame }: FrameViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={`${import.meta.env.VITE_API_URL}${frame.imageUrl}`}
          alt={`Frame from ${new Date(frame.timestamp).toLocaleTimeString()}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-white text-sm">
            {new Date(frame.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
            {frame.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          Keywords: {frame.keywords.join(', ')}
        </p>
        {frame.text && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-3">
            {frame.text}
          </p>
        )}
      </div>
    </div>
  );
} 