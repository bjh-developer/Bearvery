import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import WordlePage from './pages/Wordle'; // 👈 Import the new Wordle page

// Components
import ProtectedRoute from './components/ProtectedRoute';
import BackgroundProvider from './components/BackgroundProvider';

function App() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    // Check session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser]);

  return (
    <Router>
      <BackgroundProvider>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wordle"
            element={
              <ProtectedRoute>
                <WordlePage /> {/* 👈 Add Wordle game route */}
              </ProtectedRoute>
            }
          />
        </Routes>
      </BackgroundProvider>
      <SpeedInsights />
    </Router>
  );
}

export default App;
