// src/pages/AdminStats.js
import React, { useEffect, useState } from 'react';
import { Storage } from '../utils/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2A7DE1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminStats() {
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [practices, setPractices] = useState([]);
  const [scenes, setScenes] = useState([]);

  useEffect(() => {
    setUsers(Storage.getUsers());
    setResults(Storage.getResults());
    setPractices(Storage.getPractices());
    setScenes(Storage.getScenes());
  }, []);

  const byRole = [
    { name: 'Студенты', value: users.filter(u => u.role === 'student').length },
    { name: 'Преподаватели', value: users.filter(u => u.role === 'teacher').length },
    { name: 'Администраторы', value: users.filter(u => u.role === 'admin').length },
  ];

  const byType = [
    { name: 'Виртуальный цех', value: results.filter(r => r.sceneType === 'workshop').length },
    { name: 'Цифровой двойник', value: results.filter(r => r.sceneType === 'digital').length },
  ];

  const avgByPractice = practices.map(p => {
    const rs = results.filter(r => r.practiceId === p.id);
    return { name: p.title?.slice(0, 18) + '...', avg: rs.length ? Math.round(rs.reduce((s, r) => s + r.score, 0) / rs.length) : 0, count: rs.length };
  }).filter(p => p.count > 0);

  const recentResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Аналитика платформы</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>Сводная статистика по всем учебным заведениям</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Всего пользователей', value: users.length, icon: '👥', color: '#2A7DE1' },
          { label: '3D-сцен', value: scenes.length, icon: '🎮', color: '#22c55e' },
          { label: 'Практик создано', value: practices.length, icon: '📋', color: '#f59e0b' },
          { label: 'Прохождений', value: results.length, icon: '✅', color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="card stat-card">
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Users by role */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Пользователи по ролям</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byRole} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {byRole.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Results by practice type */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Прохождения по типу практик</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${value}`}>
                {byType.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Avg score by practice */}
      {avgByPractice.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Средний балл по практикам</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avgByPractice} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [v, n === 'avg' ? 'Средний балл' : 'Прохождений']} />
              <Bar dataKey="avg" fill="#2A7DE1" name="avg" radius={[4, 4, 0, 0]} />
              <Bar dataKey="count" fill="#e8f0fb" name="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent results */}
      {recentResults.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Последние прохождения</div>
          <table className="table">
            <thead><tr><th>Студент</th><th>Практика</th><th>Режим</th><th>Дата</th><th>Ошибок</th><th>Балл</th></tr></thead>
            <tbody>
              {recentResults.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                  <td style={{ fontSize: 13 }}>{r.practiceTitle}</td>
                  <td><span className={`badge ${r.mode === 'training' ? 'badge-green' : 'badge-red'}`}>{r.mode === 'training' ? 'Обучение' : 'Экзамен'}</span></td>
                  <td style={{ color: '#6b7280', fontSize: 13 }}>{new Date(r.date).toLocaleString('ru')}</td>
                  <td>{r.errors?.length || 0}</td>
                  <td><strong style={{ color: r.score >= 80 ? '#22c55e' : r.score >= 60 ? '#f59e0b' : '#ef4444', fontSize: 16 }}>{r.score}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
