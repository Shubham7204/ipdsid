import { useState, useEffect } from 'react';
import api from '../utils/api';

interface Session {
  _id: string;
  startTime: string;
  endTime?: string;
  frames: string[];
  report?: {
    category: string;
    keywords: string[];
    urls: string[];
    summary: string;
  };
  rawData: string[];
}

export function useSession() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/sessions');
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error(err);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const response = await api.post('/api/sessions/start');
      setCurrentSession(response.data._id);
      return response.data;
    } catch (error) {
      console.error('Failed to start session:', error);
      return null;
    }
  };

  const endSession = async () => {
    try {
      if (!currentSession) return;
      await api.post(`/api/sessions/${currentSession}/end`);
      setCurrentSession(null);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    startSession,
    endSession,
    refreshSessions: fetchSessions
  };
} 