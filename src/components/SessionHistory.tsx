import React, { useState } from 'react';
import { useSession } from '../hooks/useSession';
import { Clock, Image, FileText, ChevronDown, ChevronRight, Download } from 'lucide-react';

export function SessionHistory() {
  const { sessions, isLoading } = useSession();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-4">Loading sessions...</div>;
  }

  const handleDownloadPDF = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Clock className="text-blue-500" />
        Session History
      </h2>

      <div className="space-y-6">
        {sessions.map((session) => (
          <div key={session._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setExpandedSession(expandedSession === session._id ? null : session._id)}
                className="flex items-center space-x-3"
              >
                {expandedSession === session._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <div className="text-left">
                  <h3 className="font-medium">
                    {new Date(session.startTime).toLocaleDateString()} -{' '}
                    {new Date(session.startTime).toLocaleTimeString()}
                  </h3>
                  {session.endTime && (
                    <p className="text-sm text-gray-500">
                      Duration: {calculateDuration(session.startTime, session.endTime)}
                    </p>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  <Image className="inline mr-1" size={16} />
                  {session.frames.length} frames
                </span>
                <button
                  onClick={() => handleDownloadPDF(session._id)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50"
                >
                  <Download size={16} />
                  <span className="text-sm">PDF</span>
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedSession === session._id && (
              <div className="mt-6">
                {/* Frames Grid */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Captured Frames</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {session.frames.map((frame: any) => (
                      <div key={frame._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="relative aspect-video">
                          <img
                            src={frame.imageUrl}
                            alt={`Frame from ${new Date(frame.timestamp).toLocaleTimeString()}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-white text-sm">
                              {new Date(frame.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-2">
                            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                              {frame.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            Keywords: {frame.keywords.join(', ')}
                          </p>
                          {frame.text && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                              {frame.text}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Report */}
                {session.report && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="text-blue-600" />
                      Learning Session Report
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Session Overview</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Main Category:</span>
                            <p className="font-medium">{session.report.category}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <p className="font-medium">{calculateDuration(session.startTime, session.endTime)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Frames Captured:</span>
                            <p className="font-medium">{session.frames.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Keywords Table */}
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-4">Detected Keywords</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {session.report.keywords.map((keyword, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{keyword}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {session.frames.filter(f => f.keywords.includes(keyword)).length}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {session.report.category}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* URLs Table */}
                      {session.report.urls && session.report.urls.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-4">Detected URLs</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {session.report.urls.map((url, idx) => (
                                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{url}</a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Learning Resource</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Safe
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Session Summary</h4>
                        <p className="text-gray-700 whitespace-pre-line">{session.report.summary}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
} 