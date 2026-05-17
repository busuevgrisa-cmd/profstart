// src/pages/HomePage.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Storage } from '../utils/storage';

export default function HomePage({ setPage }) {
  const { user } = useAuth();
  const results = Storage.getResultsForStudent(user.id);
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : null;
  const practices = Storage.getPractices();
  const myPractices = practices.filter(p => p.active && (p.group === user.group || user.role !== 'student'));

  return (
    <div className="page">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #2A7DE1 0%, #1a5fb4 100%)', borderRadius: 20, padding: '32px 40px', color: '#fff', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, opacity: .8, marginBottom: 6 }}>Добро пожаловать,</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{user.name}</h1>
          <div style={{ opacity: .85, fontSize: 15 }}>
            {user.role === 'student' && `Группа: ${user.group || 'не указана'} · ${user.institution}`}
            {user.role === 'teacher' && `Преподаватель · ${user.institution}`}
            {user.role === 'admin' && 'Администратор платформы ПрофСтарт'}
          </div>
          <button className="btn" style={{ marginTop: 16, background: '#fff', color: '#2A7DE1', fontWeight: 700 }}
            onClick={() => setPage(user.role === 'student' ? 'practices' : user.role === 'teacher' ? 'manage' : 'scenes')}>
            {user.role === 'student' ? '▶ К практикам' : user.role === 'teacher' ? '⚙️ Управление' : '🔧 Панель управления'}
          </button>
        </div>
        <div style={{ fontSize: 80, opacity: .3 }}>⚙️</div>
      </div>

      {/* Student stats */}
      {user.role === 'student' && (
        <div className="grid grid-3" style={{ gap: 16, marginBottom: 28 }}>
          <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setPage('practices')}>
            <div className="stat-value" style={{ color: '#2A7DE1' }}>{myPractices.length}</div>
            <div className="stat-label">Доступно практик</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: avgScore ? (avgScore >= 80 ? '#22c55e' : '#f59e0b') : '#9ca3af' }}>{avgScore ?? '—'}</div>
            <div className="stat-label">Средний балл</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{results.length}</div>
            <div className="stat-label">Выполнено заданий</div>
          </div>
        </div>
      )}

      {/* Teacher stats */}
      {user.role === 'teacher' && (
        <div className="grid grid-3" style={{ gap: 16, marginBottom: 28 }}>
          <div className="card stat-card"><div className="stat-value">{practices.filter(p => p.teacherId === user.id).length}</div><div className="stat-label">Созданных практик</div></div>
          <div className="card stat-card"><div className="stat-value">{Storage.getResults().filter(r => practices.filter(p => p.teacherId === user.id).map(p => p.id).includes(r.practiceId)).length}</div><div className="stat-label">Прохождений</div></div>
          <div className="card stat-card"><div className="stat-value">{Storage.getScenes().length}</div><div className="stat-label">Сцен в библиотеке</div></div>
        </div>
      )}

      {/* Admin stats */}
      {user.role === 'admin' && (
        <div className="grid grid-4" style={{ gap: 16, marginBottom: 28 }}>
          <div className="card stat-card"><div className="stat-value">{Storage.getUsers().length}</div><div className="stat-label">Пользователей</div></div>
          <div className="card stat-card"><div className="stat-value">{Storage.getScenes().length}</div><div className="stat-label">3D-сцен</div></div>
          <div className="card stat-card"><div className="stat-value">{Storage.getPractices().length}</div><div className="stat-label">Практик</div></div>
          <div className="card stat-card"><div className="stat-value">{Storage.getResults().length}</div><div className="stat-label">Результатов</div></div>
        </div>
      )}

      {/* Feature cards */}
      <div className="grid grid-3" style={{ gap: 16 }}>
        {[
          { icon: '🔧', title: 'Виртуальный цех', desc: 'Работа с 3D-моделью токарного станка, пошаговое выполнение технологических операций', color: '#e8f0fb' },
          { icon: '🏭', title: 'Цифровой двойник', desc: 'Управленческие решения на реальных данных предприятия: оптимизация себестоимости и прибыли', color: '#f0fdf4' },
          { icon: '📊', title: 'Аналитика', desc: 'Отслеживайте прогресс, выявляйте частые ошибки, скачивайте отчёты по группе', color: '#fff7ed' },
        ].map((f, i) => (
          <div key={i} className="card" style={{ background: f.color, border: 'none' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
            <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
