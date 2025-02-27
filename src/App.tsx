import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { AuthForm } from './components/AuthForm';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { DataView } from './pages/DataView';
import { CapturedScreens } from './pages/CapturedScreens';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/captured-screens" element={<CapturedScreens />} />
          <Route path="/data" element={<DataView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;