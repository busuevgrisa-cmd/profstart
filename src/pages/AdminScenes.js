// src/pages/AdminScenes.js
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';

export default function AdminScenes() {
  const [scenes, setScenes] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'workshop', description: '', preview: '🔧' });
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => { setScenes(Storage.getScenes()); }, [showAdd]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.name) return;
    Storage.addScene({ id: `scene-${Date.now()}`, ...form, steps: form.type === 'workshop' ? [] : undefined });
    setShowAdd(false);
    setScenes(Storage.getScenes());
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadMsg(`✅ Файл "${file.name}" (${(file.size / 1024).toFixed(0)} KB) загружен. В MVP сохраняется локально.`);
    setTimeout(() => setUploadMsg(''), 4000);
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Библиотека 3D-сцен</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>Управление сценами и 3D-моделями</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Добавить сцену</button>
      </div>

      {/* Upload GLTF */}
      <div className="card" style={{ marginBottom: 24, background: '#f0f4ff', border: '2px dashed #2A7DE1' }}>
        <div className="card-title" style={{ marginBottom: 8 }}>📦 Загрузка 3D-модели (.gltf / .glb)</div>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>Загрузите готовые 3D-модели станков, цехов, дашбордов</p>
        <input type="file" accept=".gltf,.glb,.obj" onChange={handleFileUpload} />
        {uploadMsg && <div className="alert alert-success mt-2">{uploadMsg}</div>}
      </div>

      <div className="grid grid-2" style={{ gap: 16 }}>
        {scenes.map(scene => (
          <div key={scene.id} className="card">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 48 }}>{scene.preview}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{scene.name}</div>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>{scene.description}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`badge ${scene.type === 'workshop' ? 'badge-blue' : 'badge-orange'}`}>
                    {scene.type === 'workshop' ? '🔧 Виртуальный цех' : '🏭 Цифровой двойник'}
                  </span>
                  {scene.steps && <span className="badge badge-green">{scene.steps.length} шагов</span>}
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Удалить сцену?')) { Storage.deleteScene(scene.id); setScenes(Storage.getScenes()); } }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Добавить сцену</h2>
            <div className="form-group">
              <label className="form-label">Название</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Токарный станок ТВ-320" />
            </div>
            <div className="form-group">
              <label className="form-label">Тип сцены</label>
              <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="workshop">🔧 Виртуальный промышленный цех</option>
                <option value="digital">🏭 Цифровой двойник предприятия</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Иконка</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['🔧','🏭','⚙️','🔩','🛠️','🏗️','🔬','💡'].map(e => (
                  <button key={e} onClick={() => set('preview', e)} style={{ fontSize: 24, background: form.preview === e ? '#e8f0fb' : '#f3f4f6', border: `2px solid ${form.preview === e ? '#2A7DE1' : 'transparent'}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>✅ Добавить</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
