import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

interface Frame {
  timestamp: string;
  image: string;
  path: string;
  category?: string;
  keywords?: string[];
  text?: string;
}

interface FrameViewerProps {
  frame: Frame;
}

export function FrameViewer({ frame }: FrameViewerProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const getImageSource = () => {
    if (frame.imageUrl) {
      return `${import.meta.env.VITE_API_URL}${frame.imageUrl}`;
    } else if (frame.image) {
      return `data:image/png;base64,${frame.image}`;
    }
    return '';
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all">
        <div 
          className="relative aspect-video cursor-pointer"
          onClick={() => setShowFullscreen(true)}
        >
          <img
            src={getImageSource()}
            alt="Captured screen"
            className="w-full h-full object-cover rounded-lg border-2 border-black"
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/80 z-50">
          <div className="absolute inset-0 p-4 md:p-8 flex flex-col">
            <button
              onClick={() => setShowFullscreen(false)}
              aria-label="Close fullscreen view"
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all z-50"
            >
              <X size={24} />
            </button>
            
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={getImageSource()}
                alt="Captured screen fullview"
                className="max-w-full max-h-full object-contain rounded-lg border-2 border-black"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 