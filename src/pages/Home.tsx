import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Brain, Lock } from 'lucide-react';

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Screen Intelligence Dashboard
            </h1>
            <p className="text-xl mb-8">
              Intelligent screen monitoring and analysis for enhanced digital awareness
            </p>
            <Link 
              to="/dashboard" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Boxes */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <Eye size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600">
                Capture and analyze screen content in real-time with advanced OCR technology
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-green-600 mb-4">
                <Brain size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Intelligent content categorization and keyword extraction
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-purple-600 mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-600">
                Secure data handling with local processing and encrypted storage
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-orange-600 mb-4">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Access Control</h3>
              <p className="text-gray-600">
                Robust authentication and user management system
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 