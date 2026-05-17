// src/components/Navbar.js
import React from 'react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' };

export default function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { id: 'home', label: 'Главная' },
    { id: 'practices', label: 'Мои практики' },
    { id: 'ratings', label: 'Рейтинг' },
    { id: 'profile', label: 'Личный кабинет' },
  ];
  const teacherLinks = [
    { id: 'home', label: 'Главная' },
    { id: 'manage', label: 'Управление практиками' },
    { id: 'stats', label: 'Статистика' },
    { id: 'profile', label: 'Личный кабинет' },
  ];
  const adminLinks = [
    { id: 'home', label: 'Главная' },
    { id: 'scenes', label: 'Сцены и модели' },
    { id: 'users', label: 'Пользователи' },
    { id: 'stats', label: 'Аналитика' },
  ];

  const links = user.role === 'admin' ? adminLinks : user.role === 'teacher' ? teacherLinks : studentLinks;
  const initials = user.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <nav className="navbar">
      <span className="navbar-logo">⚙️ ПрофСтарт</span>
      <div className="navbar-links">
        {links.map(l => (
          <button key={l.id} className={`nav-link${page === l.id ? ' active' : ''}`} onClick={() => setPage(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="navbar-user">
        <div className="navbar-avatar">{initials}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
          <div className="role-badge">{ROLE_LABELS[user.role]}</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout}>Выйти</button>
      </div>
    </nav>
  );
}
