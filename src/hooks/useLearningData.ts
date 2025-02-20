import { useState, useEffect } from 'react';
import api from '../utils/api';
import type { SessionAnalysis } from '../types';

interface LearningData {
  category: string;
  keywords: string[];
  urls: string[];
  confidence: number;
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
      console.error('Failed to fetch learning data:', err);
      setError('Failed to fetch learning data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLearningData = async (data: Partial<LearningData>) => {
    try {
      await api.post('/learning-data', data);
      await fetchLearningData();
    } catch (err) {
      console.error('Failed to update learning data:', err);
    }
  };

  useEffect(() => {
    fetchLearningData();
  }, []);

  return { learningData, isLoading, error, updateLearningData };
} 