// src/pages/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';

const ROLE_LABELS = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' };
const ROLE_COLORS = { admin: '#7c3aed', teacher: '#2A7DE1', student: '#16a34a' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'pass123', role: 'teacher', institution: '', group: '' });
  const [search, setSearch] = useState('');

  useEffect(() => { setUsers(Storage.getUsers()); }, [showAdd]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = users.filter(u =>
    (filter === 'all' || u.role === filter) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    Storage.addUser({ id: `user-${Date.now()}`, ...form });
    setShowAdd(false);
    setUsers(Storage.getUsers());
    setForm({ name: '', email: '', password: 'pass123', role: 'teacher', institution: '', group: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Удалить пользователя?')) {
      Storage.deleteUser(id);
      setUsers(Storage.getUsers());
    }
  };

  const stats = { total: users.length, students: users.filter(u => u.role === 'student').length, teachers: users.filter(u => u.role === 'teacher').length };

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Управление пользователями</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>{stats.total} пользователей · {stats.students} студентов · {stats.teachers} преподавателей</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Добавить пользователя</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Поиск по имени или email" value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all', 'Все'], ['student', 'Студенты'], ['teacher', 'Преподаватели'], ['admin', 'Администраторы']].map(([val, label]) => (
            <button key={val} className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Роль</th>
              <th>Учебное заведение</th>
              <th>Группа</th>
              <th>Email</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: ROLE_COLORS[u.role] || '#6b7280',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12, flexShrink: 0
                    }}>
                      {u.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'teacher' ? 'badge-blue' : 'badge-green'}`}>{ROLE_LABELS[u.role]}</span></td>
                <td style={{ color: '#6b7280', fontSize: 13 }}>{u.institution || '—'}</td>
                <td style={{ color: '#6b7280', fontSize: 13 }}>{u.group || '—'}</td>
                <td style={{ fontSize: 13, color: '#6b7280' }}>{u.email}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Пользователи не найдены</div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Добавить пользователя</h2>
            <div className="form-group">
              <label className="form-label">ФИО</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Иванов Иван Иванович" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input className="form-input" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="student">Студент</option>
                <option value="teacher">Преподаватель</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Учебное заведение</label>
              <input className="form-input" value={form.institution} onChange={e => set('institution', e.target.value)} />
            </div>
            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label">Группа</label>
                <input className="form-input" value={form.group} onChange={e => set('group', e.target.value)} placeholder="ТМ-301" />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>Создать</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
