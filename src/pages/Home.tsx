import { Link } from 'react-router-dom';
import { Eye, Network, Bot, FileText } from 'lucide-react';

export function Home() {
  return (
    <div>
      {/* Hero Section with Neo Brutalism */}
      <section className="bg-blue-600 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl bg-white p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] border-4 border-black">
            <h1 className="text-5xl font-black mb-6 text-blue-600 leading-tight">
              Smart Child Activity Monitor
            </h1>
            <p className="text-2xl mb-8 text-gray-700">
              Advanced AI-powered monitoring system for safer digital experiences and smarter parental insights
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/dashboard" 
                className="inline-block bg-blue-600 text-white px-8 py-4 text-xl font-bold rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all"
              >
                Start Monitoring
              </Link>
              <Link 
                to="/documentation" 
                className="inline-block bg-white text-blue-600 px-8 py-4 text-xl font-bold rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Boxes with Neo Brutalism */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-black text-center mb-12 text-blue-600">Advanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Real-time Monitoring */}
            <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all">
              <div className="text-blue-600 mb-4">
                <Eye size={40} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart Monitoring</h3>
              <p className="text-gray-700">
                AI-powered screen activity tracking with content analysis
              </p>
            </div>

            {/* PDF & Text Analysis */}
            <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all">
              <div className="text-blue-600 mb-4">
                <FileText size={40} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Content Analysis</h3>
              <p className="text-gray-700">
                PDF extraction and text analysis for comprehensive monitoring
              </p>
            </div>

            {/* Federated Learning */}
            <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all">
              <div className="text-blue-600 mb-4">
                <Network size={40} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Federated Learning</h3>
              <p className="text-gray-700">
                Privacy-preserving distributed learning system
              </p>
            </div>

            {/* LLM Integration */}
            <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all">
              <div className="text-blue-600 mb-4">
                <Bot size={40} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Insights</h3>
              <p className="text-gray-700">
                Advanced LLM-powered content understanding and reporting
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 