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
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { jsPDF } from 'jspdf';
import { SessionHistory } from '../components/SessionHistory';
import { LearningProgress } from '../components/LearningProgress';
import { CombinedKnowledge } from '../components/CombinedKnowledge';

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
  const { frames = [], saveFrame } = useFrames();
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
      
      // Handle stream stop event (user clicks "Stop Sharing")
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture();
      });

      // Start capture interval
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
      setError('Failed to start screen capture. Please try again.');
      setHasPermission(false);
      // Clean up if session was started but capture failed
      if (currentSession) {
        await endSession(currentSession._id, null);
      }
    }
  };

  const stopCapture = async () => {
    // Clear capture interval
    if (captureInterval.current) {
      clearInterval(captureInterval.current);
      captureInterval.current = null;
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    // End current session if exists
    if (currentSession) {
      try {
        const analysis = await processTextAndLearn(sessionData.join('\n'), null, true);
        await endSession(currentSession._id, analysis);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }

    // Reset states
    setIsCapturing(false);
    setHasPermission(false);
  };

  const generateReport = async () => {
    try {
      setError('');
      const allText = sessionData.join('\n');
      const analysis = await processTextAndLearn(allText, null, true);
      if (analysis) {
        setReport(JSON.stringify(analysis, null, 2));
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
    return `
# Session Report - ${new Date(session.startTime).toLocaleString()}

## Overview
- **Duration**: ${session.endTime ? `${Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} minutes` : 'Ongoing'}
- **Captures**: ${session.frames.length}
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
      
      // Add title
      doc.setFontSize(20);
      doc.text('Session Report', 105, 20, { align: 'center' });
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(session.startTime).toLocaleString()}`, 20, 40);
      
      let yPosition = 60;
      
      if (session.report) {
        // Add category
        doc.text(`Category: ${session.report.category}`, 20, yPosition);
        yPosition += 10;
        
        // Add keywords
        doc.text(`Keywords: ${session.report.keywords.join(', ')}`, 20, yPosition);
        yPosition += 20;
        
        // Add URLs
        if (session.report.urls.length > 0) {
          doc.text('URLs:', 20, yPosition);
          yPosition += 10;
          session.report.urls.forEach(url => {
            doc.text(`• ${url}`, 30, yPosition);
            yPosition += 7;
          });
        }
        
        // Add summary
        yPosition += 10;
        doc.text('Summary:', 20, yPosition);
        yPosition += 10;
        
        // Split long summary text into multiple lines
        const splitSummary = doc.splitTextToSize(session.report.summary, 170);
        doc.text(splitSummary, 20, yPosition);
      }
      
      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50"
          >
            <Download size={16} />
            <span className="text-sm">Download PDF</span>
          </button>
        </div>
        <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6 px-4">
        {/* Screen Capture Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Screen Capture</h2>
            <div className="flex items-center gap-4">
              {error && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}
              <button
                onClick={isCapturing ? stopCapture : startCapture}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  isCapturing
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isCapturing ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Stop Capture
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Capture
                  </>
                )}
              </button>
            </div>
          </div>
          {isCapturing && (
            <div className="text-sm text-gray-600">
              Screen capture is active. Learning from your screen content...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Raw Session Data */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Raw Session Data</h2>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                {sessionData.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No captures yet</p>
                ) : (
                  sessionData.map((text, index) => (
                    <div key={index} className="mb-4 p-2 border-b border-gray-200 last:border-b-0 last:mb-0">
                      <p className="text-sm text-gray-600">Capture {index + 1}</p>
                      <p className="whitespace-pre-wrap">{text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <LearningProgress />
            <SessionHistory />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <CombinedKnowledge />
            
            {/* Captured Frames Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Image className="text-indigo-500" />
                  Recent Captures
                </h2>
                <span className="text-sm text-gray-500">
                  {frames.length} frames captured
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {frames.map((frame, index) => (
                  <div key={frame._id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <img
                      src={frame.imageUrl}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-48 object-cover rounded mb-3"
                      loading="lazy"
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">
                        {new Date(frame.timestamp).toLocaleString()}
                      </p>
                      {frame.category && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {frame.category}
                        </span>
                      )}
                      {frame.keywords && frame.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {frame.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 