// src/pages/StudentProfile.js
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function StudentProfile() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState('history');

  useEffect(() => {
    setResults(Storage.getResultsForStudent(user.id));
  }, [user.id]);

  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const allErrors = results.flatMap(r => (r.errors || []).map(e => ({ ...e, practice: r.practiceTitle })));
  const chartData = results.map((r, i) => ({ idx: i + 1, score: r.score, practice: r.practiceTitle?.slice(0, 12) }));

  const TABS = [['history', 'История'], ['errors', 'Мои ошибки'], ['progress', 'Прогресс']];

  return (
    <div className="page">
      <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#2A7DE1', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0
        }}>
          {user.name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>{user.name}</h1>
          <div style={{ color: '#6b7280', marginTop: 3, fontSize: 14 }}>Группа: <strong>{user.group}</strong> · {user.institution}</div>
          <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 1 }}>{user.email}</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-value">{results.length}</div><div className="stat-label">Практик пройдено</div></div>
        <div className="card stat-card"><div className="stat-value" style={{ color: avgScore >= 80 ? '#16a34a' : '#d97706' }}>{avgScore}</div><div className="stat-label">Средний балл</div></div>
        <div className="card stat-card"><div className="stat-value">{allErrors.length}</div><div className="stat-label">Ошибок всего</div></div>
        <div className="card stat-card"><div className="stat-value">{results.filter(r => r.score >= 80).length}</div><div className="stat-label">Отлично (≥80)</div></div>
      </div>

      <div className="tab-nav">
        {TABS.map(([id, label]) => (
          <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        results.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">П</div>
              <div className="empty-state-title">История практик пуста</div>
              <div className="empty-state-text">Начните первую практику, чтобы увидеть историю</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead><tr><th>Практика</th><th>Режим</th><th>Дата</th><th>Ошибок</th><th>Балл</th></tr></thead>
              <tbody>
                {[...results].reverse().map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.practiceTitle}</td>
                    <td><span className={`badge ${r.mode === 'training' ? 'badge-green' : 'badge-red'}`}>{r.mode === 'training' ? 'Обучение' : 'Экзамен'}</span></td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{new Date(r.date).toLocaleDateString('ru')}</td>
                    <td>{r.errors?.length || 0}</td>
                    <td><strong style={{ color: r.score >= 80 ? '#16a34a' : r.score >= 60 ? '#d97706' : '#dc2626', fontSize: 16 }}>{r.score}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'errors' && (
        allErrors.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>0</div>
              <div className="empty-state-title">Ошибок не обнаружено</div>
              <div className="empty-state-text">Продолжайте в том же духе</div>
            </div>
          </div>
        ) : (
          <div>
            {allErrors.map((e, i) => (
              <div key={i} className="card" style={{ marginBottom: 10, borderLeft: '3px solid #dc2626' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{e.practice}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{e.time ? new Date(e.time).toLocaleString('ru') : ''}</span>
                </div>
                <div style={{ fontSize: 14, color: '#374151' }}>{e.message}</div>
                {e.step && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Шаг: {e.step}</div>}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'progress' && (
        results.length < 2 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-text">Пройдите больше практик, чтобы увидеть динамику прогресса</div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Динамика баллов</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="idx" label={{ value: 'Попытка', position: 'bottom' }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v} баллов`]} labelFormatter={(l) => `Попытка ${l}`} />
                <Line type="monotone" dataKey="score" stroke="#2A7DE1" strokeWidth={2} dot={{ fill: '#2A7DE1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </div>
  );
}
