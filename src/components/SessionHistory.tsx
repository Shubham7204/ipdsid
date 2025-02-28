import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronRight, Download, Image, FileText } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function SessionHistory() {
  const { sessions, isLoading } = useSession();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const calculateDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;
    const seconds = Math.floor(duration / 1000);
    return `${seconds} seconds`;
  };

  const handleDownloadPDF = async (session: Session) => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();

      // Add a simple title
      doc.setFontSize(20);
      doc.text('Session Report', 20, 20);

      // Add session date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(session.startTime).toLocaleString()}`, 20, 30);

      // Set initial y position for content
      let yPosition = 40;

      // Check if report data is available
      if (session.report) {
        // Add category
        doc.text(`Category: ${session.report.category || 'N/A'}`, 20, yPosition);
        yPosition += 10;

        // Add keywords
        doc.text('Keywords:', 20, yPosition);
        yPosition += 10;
        if (Array.isArray(session.report.keywords)) {
          session.report.keywords.forEach(keyword => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`• ${keyword}`, 30, yPosition);
            yPosition += 7;
          });
        }

        // Add URLs
        yPosition += 5;
        doc.text('URLs:', 20, yPosition);
        yPosition += 10;
        if (Array.isArray(session.report.urls)) {
          session.report.urls.forEach(url => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`• ${url}`, 30, yPosition);
            yPosition += 7;
          });
        }

        // Add summary
        if (session.report.summary) {
          yPosition += 10;
          doc.text('Summary:', 20, yPosition);
          yPosition += 10;
          
          const splitSummary = doc.splitTextToSize(session.report.summary, 170);
          
          splitSummary.forEach(line => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 20, yPosition);
            yPosition += 7;
          });
        }
      } else {
        doc.text('No report data available for this session.', 20, yPosition);
      }

      // Save the PDF
      doc.save(`session-${session._id}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>;
  }

  return (
      <div className="space-y-6">
        {sessions.map((session) => (
        <div key={session._id} className="bg-white p-6 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setExpandedSession(expandedSession === session._id ? null : session._id)}
                className="flex items-center space-x-3"
              >
                {expandedSession === session._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <div className="text-left">
                <h3 className="text-xl font-bold text-blue-600">
                    {new Date(session.startTime).toLocaleDateString()} -{' '}
                    {new Date(session.startTime).toLocaleTimeString()}
                  </h3>
                  {session.endTime && (
                  <p className="text-gray-600">
                      Duration: {calculateDuration(session.startTime, session.endTime)}
                    </p>
                  )}
                </div>
              </button>
                <button
              onClick={() => handleDownloadPDF(session)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all"
                >
                  <Download size={16} />
              <span>PDF</span>
                </button>
            </div>

            {expandedSession === session._id && (
              <div className="mt-6">
              {!session.report ? (
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-500">
                  <p className="text-yellow-700">Report generation in progress...</p>
                </div>
              ) : (
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-black">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-600">
                    <FileText size={20} />
                    Session Report
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg border-2 border-black overflow-hidden">
                      <span className="text-gray-600">Category</span>
                      <p className="font-bold mt-1">{session.report.category}</p>
                          </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-black overflow-hidden">
                      <span className="text-gray-600">Keywords</span>
                      <p className="font-bold mt-1">{session.report.keywords.join(', ')}</p>
                          </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-black overflow-hidden">
                      <span className="text-gray-600">URLs</span>
                      <div className="font-bold mt-1">
                        {session.report.urls.map((url, index) => (
                          <div key={index} className="border p-2 rounded mb-1 break-words" title={url}>
                            {url}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {session.report.summary && (
                    <div className="mt-4 bg-white p-4 rounded-lg border-2 border-black">
                      <span className="text-gray-600">Summary</span>
                      <p className="mt-2">{session.report.summary}</p>
                    </div>
                  )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
    </div>
  );
} 