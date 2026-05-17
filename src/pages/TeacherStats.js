// src/pages/TeacherStats.js
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TeacherStats() {
  const { user } = useAuth();
  const [practices, setPractices] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedPractice, setSelectedPractice] = useState('all');

  useEffect(() => {
    const ps = Storage.getPractices().filter(p => p.teacherId === user.id);
    setPractices(ps);
    const practiceIds = ps.map(p => p.id);
    setResults(Storage.getResults().filter(r => practiceIds.includes(r.practiceId)));
  }, [user.id]);

  const filtered = selectedPractice === 'all' ? results : results.filter(r => r.practiceId === selectedPractice);

  const avgScore = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length) : 0;
  const totalErrors = filtered.reduce((s, r) => s + (r.errors?.length || 0), 0);
  const uniqueStudents = [...new Set(filtered.map(r => r.studentId))].length;

  // Score distribution
  const scoreDist = [
    { label: 'Отл (80-100)', count: filtered.filter(r => r.score >= 80).length, color: '#22c55e' },
    { label: 'Хор (60-79)', count: filtered.filter(r => r.score >= 60 && r.score < 80).length, color: '#f59e0b' },
    { label: 'Удовл (40-59)', count: filtered.filter(r => r.score >= 40 && r.score < 60).length, color: '#f97316' },
    { label: 'Неуд (<40)', count: filtered.filter(r => r.score < 40).length, color: '#ef4444' },
  ];

  // Per-student scores
  const studentScores = Object.values(
    filtered.reduce((acc, r) => {
      if (!acc[r.studentId]) acc[r.studentId] = { name: r.studentName, attempts: 0, best: 0, errors: 0 };
      acc[r.studentId].attempts++;
      acc[r.studentId].best = Math.max(acc[r.studentId].best, r.score);
      acc[r.studentId].errors += (r.errors?.length || 0);
      return acc;
    }, {})
  );

  // Common errors
  const allErrors = filtered.flatMap(r => r.errors || []);
  const errorCounts = allErrors.reduce((acc, e) => { acc[e.step || 'unknown'] = (acc[e.step || 'unknown'] || 0) + 1; return acc; }, {});
  const topErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const exportCSV = () => {
    const rows = [['Студент', 'Практика', 'Режим', 'Дата', 'Ошибок', 'Балл']];
    filtered.forEach(r => rows.push([r.studentName, r.practiceTitle, r.mode, new Date(r.date).toLocaleDateString('ru'), r.errors?.length || 0, r.score]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'profstart_report.csv'; a.click();
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Статистика группы</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>Результаты ваших практик</p>
        </div>
        <button className="btn btn-outline" onClick={exportCSV}>⬇ Скачать CSV</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select className="form-select" style={{ maxWidth: 320 }} value={selectedPractice} onChange={e => setSelectedPractice(e.target.value)}>
          <option value="all">Все практики</option>
          {practices.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-value">{uniqueStudents}</div><div className="stat-label">Студентов</div></div>
        <div className="card stat-card"><div className="stat-value">{filtered.length}</div><div className="stat-label">Попыток</div></div>
        <div className="card stat-card"><div className="stat-value" style={{ color: avgScore >= 80 ? '#22c55e' : '#f59e0b' }}>{avgScore}</div><div className="stat-label">Средний балл</div></div>
        <div className="card stat-card"><div className="stat-value">{totalErrors}</div><div className="stat-label">Ошибок всего</div></div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
          <div style={{ color: '#6b7280' }}>Данных пока нет. Студенты ещё не проходили практики.</div>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: 20, marginBottom: 20 }}>
          {/* Score distribution */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Распределение оценок</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDist}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Frequent errors */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Частые ошибки</div>
            {topErrors.length === 0 ? (
              <div style={{ color: '#22c55e', fontWeight: 600, textAlign: 'center', padding: 20 }}>✅ Ошибок не обнаружено!</div>
            ) : topErrors.map(([step, count], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, fontSize: 13 }}>{step}</div>
                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>{count}x</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student table */}
      {studentScores.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Результаты по студентам</div>
          <table className="table">
            <thead><tr><th>Студент</th><th>Попыток</th><th>Лучший балл</th><th>Ошибок</th><th>Оценка</th></tr></thead>
            <tbody>
              {studentScores.sort((a, b) => b.best - a.best).map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.attempts}</td>
                  <td><strong style={{ color: s.best >= 80 ? '#22c55e' : s.best >= 60 ? '#f59e0b' : '#ef4444', fontSize: 16 }}>{s.best}</strong></td>
                  <td>{s.errors}</td>
                  <td><span className={`badge ${s.best >= 80 ? 'badge-green' : s.best >= 60 ? 'badge-orange' : 'badge-red'}`}>
                    {s.best >= 80 ? 'Отлично' : s.best >= 60 ? 'Хорошо' : s.best >= 40 ? 'Удовл.' : 'Неудовл.'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
