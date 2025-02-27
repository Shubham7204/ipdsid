import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle, FileText, Link2, Tag, BarChart, ChevronDown, ChevronRight, Download, Image } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { captureScreen, initializeCapture } from '../utils/screenCapture';
import { processText } from '../utils/textProcessing';
import type { SessionAnalysis } from '../types';
import { useLearningData } from '../hooks/useLearningData';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useFrames } from '../hooks/useFrames';
import { useSession } from '../hooks/useSession';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { SessionHistory } from '../components/SessionHistory';
import 'jspdf-autotable';

export function Dashboard() {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [sessionData, setSessionData] = useState<string[]>([]);
  const [analysisData, setAnalysisData] = useState<SessionAnalysis[]>([]);
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState<string>('');
  const captureInterval = useRef<number | null>(null);
  const worker = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { learningData, updateLearningData } = useLearningData();
  const { frames, isLoading, error: framesError } = useFrames();
  const { currentSession, startSession, endSession, sessions, isLoading: sessionsLoading } = useSession();

  useEffect(() => {
    const initWorker = async () => {
      try {
        worker.current = await createWorker();
      } catch (error) {
        setError('Failed to initialize OCR. Please refresh the page.');
        console.error('Error initializing worker:', error);
      }
    };
    initWorker();

    return () => {
      if (worker.current) {
        worker.current.terminate();
      }
      stopCapture();
    };
  }, []);

  const handleLogout = () => {
    logout();
    stopCapture();
    setSessionData([]);
    setAnalysisData([]);
    setReport('');
  };

  const processTextAndLearn = async (text: string, screenshot: string | null, isReport = false) => {
    const analysis = await processText(text, isReport);
    if (analysis && screenshot) {
      await saveFrame(screenshot, { ...analysis, text });
      await updateLearningData(analysis);
    }
    return analysis;
  };

  const handleStartCapture = async () => {
    try {
      await startSession();
      setIsCapturing(true);
      // Additional capture logic...
    } catch (err) {
      setError('Failed to start capture');
      console.error(err);
    }
  };

  const handleStopCapture = async () => {
    try {
      await endSession();
      setIsCapturing(false);
      // Additional stop logic...
    } catch (err) {
      setError('Failed to stop capture');
      console.error(err);
    }
  };

  const startCapture = async () => {
    try {
      setError('');
      if (!worker.current) {
        setError('OCR not initialized. Please refresh the page.');
        return;
      }

      // Start a new session first
      const session = await startSession();
      if (!session) {
        throw new Error('Failed to start session');
      }

      // Initialize screen capture
      const stream = await initializeCapture();
      if (!stream) {
        throw new Error('Failed to initialize screen capture');
      }

      // Store the stream reference and update state
      streamRef.current = stream;
      setHasPermission(true);
      setIsCapturing(true);

      // Start Flask screen capture for Recent Captures
      const response = await fetch('http://localhost:5000/api/capture/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start screen capture');
      }

      // Start capture interval for text extraction
      captureInterval.current = window.setInterval(async () => {
        if (streamRef.current && worker.current) {
          const screenshot = await captureScreen(streamRef.current);
          if (screenshot) {
            try {
              const { data: { text } } = await worker.current.recognize(screenshot);
              if (text && text.trim()) {
                setSessionData(prev => [...prev, text]);
                const analysis = await processTextAndLearn(text, screenshot);
                if (analysis) {
                  setAnalysisData(prev => [...prev, analysis]);
                }
              }
            } catch (error) {
              console.error('Error processing capture:', error);
            }
          }
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting capture:', error);
      setError('Failed to start capture');
    }
  };

  const stopCapture = async () => {
    try {
      // Clear capture interval
      if (captureInterval.current) {
        clearInterval(captureInterval.current);
        captureInterval.current = null;
      }

      // Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setIsCapturing(false);

      // Generate report if we have session data
      if (currentSession && sessionData.length > 0) {
        console.log('Generating final session report...');
        const allText = sessionData.join('\n');
        const analysis = await processTextAndLearn(allText, null, true);
        
        if (analysis) {
          console.log('Report generated:', analysis);
          await endSession(currentSession._id, analysis);
        } else {
          console.error('Failed to generate session report');
        }
      }

    } catch (error) {
      console.error('Error stopping capture:', error);
      setError('Failed to stop capture properly');
    }
  };

  const generateReport = async () => {
    try {
      setError('');
      const allText = sessionData.join('\n');
      // Add logging to debug
      console.log('Processing text:', allText);
      
      const analysis = await processTextAndLearn(allText, null, true);
      console.log('Analysis result:', analysis);
      
      if (analysis) {
        // Make sure analysis matches SessionAnalysis interface
        const report: SessionAnalysis = {
          category: analysis.category || 'Unknown',
          topics: analysis.topics || [],
          keywords: analysis.keywords || [],
          urls: analysis.urls || [],
          summary: analysis.summary || ''
        };
        
        // Save report to session
        await api.post(`/api/sessions/${currentSession}/report`, report);
        setReport(JSON.stringify(report, null, 2));
        
        // Refresh sessions to show new report
        refreshSessions();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const generateMarkdown = (session) => {
    const duration = session.endTime 
      ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
      : Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000);

    return `
# Session Report - ${new Date(session.startTime).toLocaleString()}

## Overview
- **Duration**: ${duration} seconds
- **Category**: ${session.report?.category || 'N/A'}

## Analysis
${session.report ? `
### Keywords
${session.report.keywords.map(k => `- ${k}`).join('\n')}

### URLs
${session.report.urls.map(url => `- [${url}](${url})`).join('\n')}

### Summary
${session.report.summary}
` : 'No analysis available'}
`;
  };

  const handleDownloadPDF = async (session: Session, filename: string) => {
    try {
      const doc = new jsPDF();

      // Add a simple title
      doc.setFontSize(20);
      doc.text('Session Report', 20, 20);

      // Add session date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(session.startTime).toLocaleString()}`, 20, 30);

      // Check if report data is available
      if (session.report) {
        let yPosition = 40;

        // Add category
        doc.text(`Category: ${session.report.category}`, 20, yPosition);
        yPosition += 10;

        // Add keywords
        doc.text('Keywords:', 20, yPosition);
        yPosition += 10;
        session.report.keywords.forEach(keyword => {
          doc.text(`• ${keyword}`, 30, yPosition);
          yPosition += 7;
        });

        // Add URLs
        yPosition += 10;
        doc.text('URLs:', 20, yPosition);
        yPosition += 10;
        session.report.urls.forEach(url => {
          doc.text(`• ${url}`, 30, yPosition);
          yPosition += 7;
        });

        // Add summary
        if (session.report.summary) {
          yPosition += 10;
          doc.text('Summary:', 20, yPosition);
          yPosition += 10;
          const splitSummary = doc.splitTextToSize(session.report.summary, 170);
          splitSummary.forEach(line => {
            doc.text(line, 20, yPosition);
            yPosition += 7;
          });
        }
      }

      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  const renderSessionHistory = () => {
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4">
          No session history available
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sessions.map((session) => {
          const markdown = generateMarkdown(session);
          
          return (
            <div key={session._id} className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <button
                  onClick={() => setExpandedSession(expandedSession === session._id ? null : session._id)}
                  className="flex items-center space-x-3"
                >
                  {expandedSession === session._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <div className="text-left">
                    <h3 className="font-medium">Session {new Date(session.startTime).toLocaleString()}</h3>
                    <p className="text-sm text-gray-500">
                      {session.frames.length} captures • {session.report?.category || 'No category'}
                    </p>
                  </div>
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownloadPDF(session, `session-${session._id}.pdf`)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50"
                  >
                    <Download size={16} />
                    <span className="text-sm">PDF</span>
                  </button>
                </div>
              </div>

              {expandedSession === session._id && (
                <div className="border-t p-4">
                  <div className="prose max-w-none">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCurrentSessionReport = () => {
    if (!currentSession?.report) return null;

    const markdown = generateMarkdown(currentSession);

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="text-gray-500" />
            <h2 className="text-xl font-semibold">Session Report</h2>
          </div>
          <button
            onClick={() => handleDownloadPDF(currentSession, `current-session-${currentSession._id}.pdf`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
        </div>
        <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading frames...</div>;
  }

  if (framesError) {
    return <div>Error: {framesError}</div>;
  }

  return (
    <div className="min-h-screen bg-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Main Control Panel */}
        <div className="bg-white p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] border-4 border-black mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-black text-blue-600">Activity Monitor</h1>
            <div className="flex gap-4">
              {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-lg border-2 border-red-500">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}
              {!isCapturing ? (
                <button
                  onClick={startCapture}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all"
                >
                  <Play size={20} />
                  Start Monitoring
                </button>
              ) : (
                <button
                  onClick={stopCapture}
                  className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg font-bold border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all"
                >
                  <Pause size={20} />
                  Stop Monitoring
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Card */}
            <div className="bg-blue-50 p-6 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
              <h3 className="text-2xl font-bold mb-4 text-blue-600">Status</h3>
              <div className="flex items-center gap-2 text-lg">
                <div className={`w-3 h-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-gray-400'}`} />
                {isCapturing ? 'Monitoring Active' : 'Monitoring Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout for Session Data and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Raw Session Data */}
          <div className="bg-white p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] border-4 border-black">
            <h2 className="text-3xl font-black mb-6 text-blue-600">Raw Session Data</h2>
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-black max-h-[600px] overflow-y-auto">
              {sessionData.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No captures yet</p>
              ) : (
                sessionData.map((text, index) => (
                  <div key={index} className="mb-4 p-4 bg-white rounded-lg border-2 border-black last:mb-0">
                    <p className="text-sm font-bold text-blue-600 mb-2">Capture {index + 1}</p>
                    <p className="whitespace-pre-wrap">{text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Session History */}
          <div className="bg-white p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] border-4 border-black">
            <h2 className="text-3xl font-black mb-6 text-blue-600">Session History</h2>
            <div className="max-h-[600px] overflow-y-auto">
              <SessionHistory />
            </div>
          </div>
        </div>

        {/* Current Session Report - Full Width */}
        {currentSession?.report && (
          <div className="mt-8 bg-white p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] border-4 border-black">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-blue-600">Current Report</h2>
              <button
                onClick={() => handleDownloadPDF(currentSession, `current-session-${currentSession._id}.pdf`)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all"
              >
                <Download size={16} />
                <span>Download PDF</span>
              </button>
            </div>
            <div className="prose max-w-none bg-blue-50 p-6 rounded-lg border-2 border-black">
              <ReactMarkdown>{generateMarkdown(currentSession)}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 