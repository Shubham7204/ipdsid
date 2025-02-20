import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-gray-800">
                SID
              </Link>
              {isAuthenticated && (
                <div className="flex space-x-4">
                  <Link 
                    to="/dashboard"
                    className={`${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/data"
                    className={`${location.pathname === '/data' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
                  >
                    Data
                  </Link>
                </div>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">SID - Screen Intelligence Dashboard</h3>
              <p className="text-gray-400 mt-2">© 2024 All rights reserved</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 