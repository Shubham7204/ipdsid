import { useState, useEffect } from 'react';
import { Image, RefreshCw } from 'lucide-react';
import { FrameViewer } from '../components/FrameViewer';

interface CapturedFrame {
  timestamp: string;
  image: string;
  path: string;
}

export function CapturedScreens() {
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFrames = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/frames/all');
      if (!response.ok) {
        throw new Error('Failed to fetch frames');
      }
      const data = await response.json();
      setFrames(data.frames || []);
    } catch (err) {
      setError('Failed to load captured screens');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] border-4 border-black">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Image size={32} className="text-blue-600" />
              <h1 className="text-4xl font-black text-blue-600">Captured Screens</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-gray-600">
                {frames.length} captures
              </span>
              <button
                onClick={fetchFrames}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all"
              >
                <RefreshCw size={20} />
                Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg border-2 border-red-500 text-center font-bold">
              {error}
            </div>
          ) : frames.length === 0 ? (
            <div className="bg-blue-50 p-12 rounded-lg border-4 border-black text-center">
              <p className="text-2xl font-bold text-gray-600">No captured screens yet</p>
              <p className="text-gray-500 mt-2">Start monitoring to capture screens</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {frames.map((frame) => (
                <FrameViewer key={frame.timestamp} frame={frame} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 