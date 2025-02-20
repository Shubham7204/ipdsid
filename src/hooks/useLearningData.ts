import { useState, useEffect } from 'react';
import api from '../utils/api';

interface LearningData {
  categories: { [key: string]: number };
  keywords: { [key: string]: number };
  lastUpdated: string;
}

export function useLearningData() {
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLearningData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/learning-data/combined');
      
      const transformedData = {
        categories: response.data.categories.sort((a, b) => b.count - a.count),
        keywords: response.data.keywords.sort((a, b) => b.count - a.count),
        urls: response.data.urls.sort((a, b) => b.visits - a.visits),
        stats: response.data.stats,
        lastUpdated: response.data.stats.lastUpdated
      };
      
      setLearningData(transformedData);
    } catch (err) {
      console.error('Failed to fetch learning data:', err);
      setError('Failed to fetch learning data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLearningData = async (analysis: { category: string; keywords: string[] }) => {
    try {
      const response = await api.post('/learning-data/update', analysis);
      setLearningData(response.data);
    } catch (err) {
      console.error('Failed to update learning data:', err);
    }
  };

  useEffect(() => {
    fetchLearningData();
    const interval = setInterval(fetchLearningData, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    learningData,
    isLoading,
    error,
    updateLearningData,
    refetch: fetchLearningData
  };
} 