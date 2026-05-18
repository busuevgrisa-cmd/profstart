// src/App.js
import React, { useState } from 'react';
import './styles.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StudentPractices from './pages/StudentPractices';
import StudentProfile from './pages/StudentProfile';
import RatingsPage from './pages/RatingsPage';
import TeacherManage from './pages/TeacherManage';
import TeacherStats from './pages/TeacherStats';
import AdminScenes from './pages/AdminScenes';
import AdminUsers from './pages/AdminUsers';
import AdminStats from './pages/AdminStats';

function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState('home');

  if (!user) return <LoginPage />;

  const renderPage = () => {
    // Student pages
    if (user.role === 'student') {
      switch (page) {
        case 'home': return <HomePage setPage={setPage} />;
        case 'practices': return <StudentPractices />;
        case 'ratings': return <RatingsPage />;
        case 'profile': return <StudentProfile />;
        default: return <HomePage setPage={setPage} />;
      }
    }
    // Teacher pages
    if (user.role === 'teacher') {
      switch (page) {
        case 'home': return <HomePage setPage={setPage} />;
        case 'manage': return <TeacherManage />;
        case 'stats': return <TeacherStats />;
        case 'ratings': return <RatingsPage />;
        case 'profile': return <StudentProfile />;
        default: return <HomePage setPage={setPage} />;
      }
    }
    // Admin pages
    if (user.role === 'admin') {
      switch (page) {
        case 'home': return <HomePage setPage={setPage} />;
        case 'scenes': return <AdminScenes />;
        case 'users': return <AdminUsers />;
        case 'stats': return <AdminStats />;
        default: return <HomePage setPage={setPage} />;
      }
    }
  };

  return (
    <div className="app">
      <Navbar page={page} setPage={setPage} />
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
      <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 32px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
        © 2025 ПрофСтарт — Платформа виртуальных практик для учебных заведений
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
