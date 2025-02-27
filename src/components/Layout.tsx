import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  Image, 
  Download,
  Brain,
  Network,
  Settings,
  Menu,
  X
} from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Monitor' },
    { path: '/captured-screens', icon: <Image size={20} />, label: 'Captures' },
    { path: '/data', icon: <Network size={20} />, label: 'Federation' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Neo Brutalism Navbar */}
      <nav className="bg-blue-600 border-b-4 border-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-black text-white">
                KidGuard
              </Link>
              
              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Desktop Navigation */}
              {isAuthenticated && (
                <div className="hidden lg:flex space-x-4">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-bold
                        ${location.pathname === item.path 
                          ? 'bg-white text-blue-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]' 
                          : 'text-white hover:bg-blue-500'}
                      `}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Navigation */}
            {isAuthenticated && isMenuOpen && (
              <div className="lg:hidden absolute top-full left-0 right-0 bg-blue-600 border-b-4 border-black">
                <div className="container mx-auto px-4 py-4 space-y-2">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-bold w-full
                        ${location.pathname === item.path 
                          ? 'bg-white text-blue-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]' 
                          : 'text-white hover:bg-blue-500'}
                      `}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow bg-blue-50">
        {children}
      </main>

      {/* Neo Brutalism Footer */}
      <footer className="bg-blue-600 text-white py-8 border-t-4 border-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-black">KidGuard</h3>
              <p className="text-blue-100 mt-2">Protecting digital futures</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">Smart Monitoring</a></li>
                <li><a href="#" className="hover:underline">Federation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">Documentation</a></li>
                <li><a href="#" className="hover:underline">Privacy</a></li>
                <li><a href="#" className="hover:underline">Support</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 