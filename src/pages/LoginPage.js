// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', group: '', role: 'student', institution: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const ok = login(form.email, form.password);
    if (!ok) setError('Неверный email или пароль');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    if (!form.name || !form.email || !form.password) { setError('Заполните все поля'); setLoading(false); return; }
    const res = register({ ...form, id: `user-${Date.now()}` });
    if (res.error) setError(res.error);
    setLoading(false);
  };

  const DEMO = [
    { label: 'Студент', email: 'petrov@student.ru', pass: 'student123' },
    { label: 'Преподаватель', email: 'ivanova@college.ru', pass: 'teacher123' },
    { label: 'Администратор', email: 'admin@profstart.ru', pass: 'admin123' },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>ПрофСтарт</h1>
          <p>Платформа виртуальных практик</p>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
          {[['login', 'Войти'], ['register', 'Регистрация']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="btn" style={{
              flex: 1, background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? '#2A7DE1' : '#6b7280',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              padding: '8px 16px'
            }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.ru" required />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
            <div style={{ marginTop: 20, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.4px' }}>Демо-аккаунты</div>
              {DEMO.map(d => (
                <button key={d.label} type="button" onClick={() => { set('email', d.email); set('password', d.pass); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13, transition: 'border-color .15s' }}>
                  <strong style={{ color: '#374151' }}>{d.label}:</strong> <span style={{ color: '#6b7280' }}>{d.email}</span>
                </button>
              ))}
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">ФИО</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Иванов Иван Иванович" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.ru" required />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="student">Студент</option>
                <option value="teacher">Преподаватель</option>
              </select>
            </div>
            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label">Группа</label>
                <input className="form-input" value={form.group} onChange={e => set('group', e.target.value)} placeholder="ТМ-301" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Учебное заведение</label>
              <input className="form-input" value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="Технический колледж №5" />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
