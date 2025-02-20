import { useState, useEffect } from 'react';
import api from '../utils/api';

interface Frame {
  _id: string;
  imageUrl: string;
  timestamp: string;
  category: string;
  keywords: string[];
  text: string;
}

export function useFrames() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFrames = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/frames');
      setFrames(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to fetch frames');
      console.error(err);
      setFrames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFrame = async (imageData: string, analysis: any) => {
    try {
      await api.post('/frames', {
        imageData,
        category: analysis.category,
        keywords: analysis.keywords,
        text: analysis.text
      });
      await fetchFrames();
    } catch (err) {
      console.error('Failed to save frame:', err);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  return { frames, isLoading, error, saveFrame, refreshFrames: fetchFrames };
} 