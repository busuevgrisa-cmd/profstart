// src/pages/RatingsPage.js
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

export default function RatingsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setResults(Storage.getResults());
    setUsers(Storage.getUsers());
  }, []);

  const students = users.filter(u => u.role === 'student');
  const leaderboard = students.map(s => {
    const rs = results.filter(r => r.studentId === s.id);
    const best = rs.length ? Math.max(...rs.map(r => r.score)) : 0;
    const avg = rs.length ? Math.round(rs.reduce((sum, r) => sum + r.score, 0) / rs.length) : 0;
    return { ...s, best, avg, attempts: rs.length };
  }).filter(s => s.attempts > 0).sort((a, b) => b.best - a.best);

  const myRank = leaderboard.findIndex(s => s.id === user.id) + 1;

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🏆 Рейтинг студентов</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>Лучшие результаты по всем практикам</p>
      </div>

      {user.role === 'student' && myRank > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          Ваше место в рейтинге: <strong>#{myRank}</strong> из {leaderboard.length} студентов
        </div>
      )}

      {leaderboard.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Рейтинг пуст</div>
          <div style={{ color: '#6b7280', marginTop: 4 }}>Пройдите первую практику, чтобы попасть в рейтинг!</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Место</th>
                <th>Студент</th>
                <th>Учебное заведение</th>
                <th>Группа</th>
                <th>Попыток</th>
                <th>Средний балл</th>
                <th>Лучший балл</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((s, i) => {
                const isMe = s.id === user.id;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                return (
                  <tr key={s.id} style={{ background: isMe ? '#eff6ff' : undefined }}>
                    <td style={{ textAlign: 'center', fontSize: i < 3 ? 22 : 16, fontWeight: 700 }}>{medal}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isMe ? '#2A7DE1' : '#e5e7eb', color: isMe ? '#fff' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {s.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: isMe ? 700 : 500 }}>{s.name} {isMe && <span style={{ color: '#2A7DE1', fontSize: 12 }}>(вы)</span>}</span>
                      </div>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{s.institution || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{s.group || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{s.attempts}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: s.avg >= 80 ? '#22c55e' : s.avg >= 60 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{s.avg}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong style={{ fontSize: 18, color: s.best >= 80 ? '#22c55e' : s.best >= 60 ? '#f59e0b' : '#ef4444' }}>{s.best}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
