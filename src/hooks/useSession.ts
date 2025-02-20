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
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
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
      const response = await api.post('/sessions/start');
      setCurrentSession(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to start session:', err);
      throw err;
    }
  };

  const endSession = async (sessionId: string, report: any) => {
    try {
      await api.post(`/sessions/${sessionId}/end`, { report });
      setCurrentSession(null);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to end session:', err);
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