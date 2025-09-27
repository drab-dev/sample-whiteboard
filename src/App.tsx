import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { WhiteboardCanvas } from './components/whiteboard/WhiteboardCanvas';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedWhiteboardId, setSelectedWhiteboardId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        {authMode === 'login' ? (
          <LoginForm onToggleMode={() => setAuthMode('register')} />
        ) : (
          <RegisterForm onToggleMode={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  if (selectedWhiteboardId) {
    return (
      <WhiteboardCanvas 
        whiteboardId={selectedWhiteboardId}
        onBack={() => setSelectedWhiteboardId(null)}
      />
    );
  }

  return (
    <Dashboard onSelectWhiteboard={setSelectedWhiteboardId} />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;