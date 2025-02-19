import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle, FileText, Link2, Tag, BarChart, Database, ArrowRight, Table } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { captureScreen, initializeCapture } from './utils/screenCapture';
import { processText, categories, keywordsByCategory, commonUrls } from './utils/textProcessing';
import type { SessionAnalysis } from './types';
import { DataView } from './pages/DataView';
import { AuthForm } from './components/AuthForm';
import { useAuth } from './context/AuthContext';
import { useLearningData } from './hooks/useLearningData';

function App() {
  const { isAuthenticated, logout } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [sessionData, setSessionData] = useState<string[]>([]);
  const [analysisData, setAnalysisData] = useState<SessionAnalysis[]>([]);
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showDataView, setShowDataView] = useState(false);
  const captureInterval = useRef<number | null>(null);
  const worker = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { learningData, updateLearningData } = useLearningData();

  useEffect(() => {
    const initWorker = async () => {
      try {
        worker.current = await createWorker();
        await worker.current.loadLanguage('eng');
        await worker.current.initialize('eng');
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

  const processTextAndLearn = async (text: string, isReport = false) => {
    const analysis = await processText(text, isReport);
    if (analysis) {
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

      const stream = await initializeCapture();
      if (stream) {
        streamRef.current = stream;
        setHasPermission(true);
        setIsCapturing(true);
        
        captureInterval.current = window.setInterval(async () => {
          if (streamRef.current && worker.current) {
            const screenshot = await captureScreen(streamRef.current);
            if (screenshot) {
              try {
                const { data: { text } } = await worker.current.recognize(screenshot);
                if (text && text.trim()) {
                  setSessionData(prev => [...prev, text]);
                  const analysis = await processTextAndLearn(text);
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
      }
    } catch (error) {
      console.error('Error starting capture:', error);
      setError('Failed to start screen capture. Please try again.');
      setHasPermission(false);
    }
  };

  const stopCapture = () => {
    if (captureInterval.current) {
      clearInterval(captureInterval.current);
      captureInterval.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const generateReport = async () => {
    try {
      setError('');
      const allText = sessionData.join('\n');
      const analysis = await processTextAndLearn(allText, true);
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
        <Database className="text-purple-500" />
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

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  if (showDataView) {
    return (
      <>
        <button
          onClick={() => setShowDataView(false)}
          className="fixed top-4 right-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-md"
        >
          Back to Dashboard
        </button>
        <DataView />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Screen Analysis System</h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDataView(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    <Table size={20} />
                    View Data Tables
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Logout
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

              <div className="flex gap-4 mb-6">
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

            {/* Pre-fed Data */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="text-indigo-500" />
                <h2 className="text-xl font-semibold">Pre-fed Categories & Keywords</h2>
              </div>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight size={16} className="text-indigo-500" />
                      <h3 className="font-medium capitalize">{category}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {keywordsByCategory[category].map((keyword) => (
                        <span key={keyword} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <strong>Common URLs:</strong>{' '}
                      {commonUrls[category].map((url, index) => (
                        <React.Fragment key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {url}
                          </a>
                          {index < commonUrls[category].length - 1 && ', '}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                <h2 className="text-xl font-semibold">Extracted URLs</h2>
              </div>
              <div className="space-y-2">
                {analysisData.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No URLs detected yet</p>
                ) : (
                  analysisData.flatMap(data => data.urls || []).map((url, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {url}
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detected Keywords */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="text-green-500" />
                <h2 className="text-xl font-semibold">Detected Keywords</h2>
              </div>
              {analysisData.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No keywords detected yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {analysisData.flatMap(data => data.keywords || []).map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="text-purple-500" />
                <h2 className="text-xl font-semibold">Category Distribution</h2>
              </div>
              {analysisData.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No categories detected yet</p>
              ) : (
                <div className="space-y-3">
                  {analysisData.map((data, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{data.category}</span>
                        <span className="text-gray-500">Capture {index + 1}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Report */}
            {report && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Session Report</h2>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {report}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;