import { useState, useEffect } from 'react';
import api from '../utils/api';
import type { SessionAnalysis } from '../types';

interface LearningData {
  category: string;
  keywords: string[];
  urls: string[];
  frequency: number;
  confidence: number;
  lastUpdated: Date;
}

export function useLearningData() {
  const [learningData, setLearningData] = useState<LearningData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLearningData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/learning-data');
      setLearningData(response.data);
    } catch (err) {
      setError('Failed to fetch learning data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLearningData = async (analysis: SessionAnalysis) => {
    try {
      const { category, keywords, urls } = analysis;
      const confidence = 0.8;

      console.log('Sending data to server:', {
        category,
        keywords,
        urls,
        confidence,
      });

      const response = await api.post('/learning-data', {
        category,
        keywords,
        urls,
        confidence,
      });

      console.log('Server response:', response.data);
      await fetchLearningData();
    } catch (err) {
      console.error('Failed to update learning data:', err);
      if (err.response) {
        console.error('Server error:', err.response.data);
      }
    }
  };

  useEffect(() => {
    fetchLearningData();
  }, []);

  return {
    learningData,
    isLoading,
    error,
    updateLearningData,
    refreshLearningData: fetchLearningData,
  };
} 