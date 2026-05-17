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

  return (
    <div className="page">
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#2A7DE1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
          {user.name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user.name}</h1>
          <div style={{ color: '#6b7280', marginTop: 2 }}>Группа: <strong>{user.group}</strong> · {user.institution}</div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>{user.email}</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-value">{results.length}</div><div className="stat-label">Практик пройдено</div></div>
        <div className="card stat-card"><div className="stat-value" style={{ color: avgScore >= 80 ? '#22c55e' : '#f59e0b' }}>{avgScore}</div><div className="stat-label">Средний балл</div></div>
        <div className="card stat-card"><div className="stat-value">{allErrors.length}</div><div className="stat-label">Ошибок всего</div></div>
        <div className="card stat-card"><div className="stat-value">{results.filter(r => r.score >= 80).length}</div><div className="stat-label">Отлично (≥80)</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {[['history', '📋 История'], ['errors', '❌ Мои ошибки'], ['progress', '📈 Прогресс']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="btn btn-sm"
            style={{ background: 'none', borderBottom: tab === id ? '2px solid #2A7DE1' : 'none', borderRadius: 0, color: tab === id ? '#2A7DE1' : '#6b7280', fontWeight: tab === id ? 700 : 400, marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        results.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
            <div>История практик пуста. Начните первую практику!</div>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Практика</th><th>Тип</th><th>Режим</th><th>Дата</th><th>Ошибок</th><th>Балл</th></tr></thead>
            <tbody>
              {[...results].reverse().map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.practiceTitle}</td>
                  <td><span className={`badge ${r.sceneType === 'workshop' ? 'badge-blue' : 'badge-orange'}`}>{r.sceneType === 'workshop' ? '🔧 Цех' : '🏭 Двойник'}</span></td>
                  <td><span className={`badge ${r.mode === 'training' ? 'badge-green' : 'badge-red'}`}>{r.mode === 'training' ? 'Обучение' : 'Экзамен'}</span></td>
                  <td style={{ color: '#6b7280', fontSize: 13 }}>{new Date(r.date).toLocaleDateString('ru')}</td>
                  <td>{r.errors?.length || 0}</td>
                  <td><strong style={{ color: r.score >= 80 ? '#22c55e' : r.score >= 60 ? '#f59e0b' : '#ef4444', fontSize: 16 }}>{r.score}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'errors' && (
        allErrors.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Ошибок не обнаружено!</div>
            <div style={{ color: '#6b7280' }}>Продолжайте в том же духе</div>
          </div>
        ) : (
          <div>
            {allErrors.map((e, i) => (
              <div key={i} className="card" style={{ marginBottom: 12, borderLeft: '3px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{e.practice}</span>
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
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#6b7280' }}>Пройдите больше практик, чтобы видеть прогресс</div>
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
                <Line type="monotone" dataKey="score" stroke="#2A7DE1" strokeWidth={2} dot={{ fill: '#2A7DE1', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </div>
  );
}
