import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle, FileText, Link2, Tag, BarChart, ChevronDown, ChevronRight, Download } from 'lucide-react';
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

export function Dashboard() {
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
  const { currentSession, startSession, endSession, sessions } = useSession();

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

  const renderLearningProgress = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold">Learning Progress</h2>
      </div>
      <div className="space-y-4">
        {learningData.map((data) => (
          <div key={data.category} className="border-b border-gray-100 pb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium capitalize">{data.category}</h3>
              <span className="text-sm text-gray-500">
                Frequency: {data.frequency}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-sm text-gray-600">
                Confidence: {(data.confidence * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${data.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFrames = () => {
    if (!Array.isArray(frames)) {
      console.error('Frames is not an array:', frames);
      return null;
    }

    return frames.map((frame) => (
      <div key={frame._id} className="border rounded-lg p-4">
        <img 
          src={frame.imageUrl} 
          alt={`Capture at ${new Date(frame.timestamp).toLocaleString()}`}
          className="w-full h-48 object-cover rounded mb-2"
        />
        <div className="text-sm text-gray-600">
          <p>Category: {frame.category}</p>
          <p>Time: {new Date(frame.timestamp).toLocaleString()}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {frame.keywords.map((keyword, i) => (
              <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    ));
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
    const [expandedSession, setExpandedSession] = useState<string | null>(null);

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
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <button
                    onClick={isCapturing ? stopCapture : startCapture}
                    disabled={!!error}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isCapturing 
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isCapturing ? (
                      <>
                        <Pause size={20} />
                        Stop Capture
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Start Capture
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={generateReport}
                    disabled={sessionData.length === 0 || !!error}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={20} />
                    Generate Report
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 mb-4">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                </div>
              )}
              
              {!hasPermission && !error && (
                <div className="flex items-center gap-2 text-amber-600 mb-4">
                  <AlertCircle size={20} />
                  <p>Screen capture permission required</p>
                </div>
              )}
            </div>

            {/* Session Data */}
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
          </div>

          {/* Analysis Dashboard */}
          <div className="space-y-6">
            {renderLearningProgress()}
            
            {/* Extracted URLs */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="text-blue-500" />
                <h2 className="text-xl font-semibold">Detected URLs</h2>
              </div>
              <div className="space-y-2">
                {analysisData.flatMap(data => data.urls).map((url, index) => (
                  <div key={index} className="text-blue-600 hover:underline">
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                  </div>
                ))}
              </div>
            </div>

            {/* Detected Keywords */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="text-green-500" />
                <h2 className="text-xl font-semibold">Detected Keywords</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisData.flatMap(data => data.keywords).map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="text-purple-500" />
                <h2 className="text-xl font-semibold">Category Distribution</h2>
              </div>
              {analysisData.map((data, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 capitalize">
                      {data.category}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">
                      Confidence: {(0.8 * 100).toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${0.8 * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Session Report */}
            {renderCurrentSessionReport()}

            {/* Add Captured Frames Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Captured Frames</h2>
              <div className="frames-container">
                {renderFrames()}
              </div>
            </div>

            {/* Session History */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Session History</h2>
                <span className="text-sm text-gray-500">
                  {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} recorded
                </span>
              </div>
              {renderSessionHistory()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 