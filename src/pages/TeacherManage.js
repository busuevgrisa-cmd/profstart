// src/pages/TeacherManage.js
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

export default function TeacherManage() {
  const { user } = useAuth();
  const [practices, setPractices] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', sceneId: '', group: '', mode: 'training', criteria: '', requiredAttempts: 2, targetCostReduction: 5, showErrors: true });
  const [csvData, setCsvData] = useState(null);

  useEffect(() => {
    setPractices(Storage.getPractices().filter(p => p.teacherId === user.id));
    setScenes(Storage.getScenes());
  }, [user.id, showCreate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = () => {
    if (!form.title || !form.sceneId) return;
    const p = { id: `p-${Date.now()}`, teacherId: user.id, active: true, createdAt: new Date().toISOString(), ...form };
    Storage.addPractice(p);
    setShowCreate(false);
    setForm({ title: '', sceneId: '', group: '', mode: 'training', criteria: '', requiredAttempts: 2, targetCostReduction: 5, showErrors: true });
    setPractices(Storage.getPractices().filter(p => p.teacherId === user.id));
  };

  const toggleMode = (id, currentMode) => {
    Storage.updatePractice(id, { mode: currentMode === 'training' ? 'exam' : 'training' });
    setPractices(Storage.getPractices().filter(p => p.teacherId === user.id));
  };
  const toggleActive = (id, currentActive) => {
    Storage.updatePractice(id, { active: !currentActive });
    setPractices(Storage.getPractices().filter(p => p.teacherId === user.id));
  };
  const deletePractice = (id) => {
    if (window.confirm('Удалить практику?')) {
      Storage.deletePractice(id);
      setPractices(Storage.getPractices().filter(p => p.teacherId === user.id));
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = text.split('\n').filter(Boolean).map(r => r.split(','));
      setCsvData(rows);
    };
    reader.readAsText(file);
  };

  const getScene = (id) => scenes.find(s => s.id === id);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Управление практиками</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>{practices.length} практик создано</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Создать практику</button>
      </div>

      {practices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Нет созданных практик</div>
          <div style={{ color: '#6b7280', marginBottom: 20 }}>Создайте первую практику для ваших студентов</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Создать практику</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {practices.map(p => {
            const scene = getScene(p.sceneId);
            const results = Storage.getResultsForPractice(p.id);
            return (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ fontSize: 40 }}>{scene?.preview || '📋'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{p.title}</span>
                      <span className={`badge ${p.active ? 'badge-green' : 'badge-gray'}`}>{p.active ? 'Активна' : 'Неактивна'}</span>
                      <span className={`badge ${p.mode === 'training' ? 'badge-blue' : 'badge-red'}`}>{p.mode === 'training' ? '📚 Обучение' : '📝 Экзамен'}</span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 6 }}>
                      {scene?.name} · Группа: <strong>{p.group || 'все'}</strong> · Прошли: <strong>{results.length}</strong> студентов
                    </div>
                    {p.criteria && <div style={{ fontSize: 13, color: '#374151', background: '#f8fafc', padding: '6px 10px', borderRadius: 6 }}>{p.criteria}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => toggleMode(p.id, p.mode)}>
                      {p.mode === 'training' ? '→ В экзамен' : '→ В обучение'}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(p.id, p.active)}>
                      {p.active ? '⏸ Деактивировать' : '▶ Активировать'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deletePractice(p.id)}>Удалить</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSV Upload section */}
      <div className="card mt-6">
        <div className="card-title" style={{ marginBottom: 12 }}>📂 Загрузка данных предприятия (CSV)</div>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>Загрузите CSV-файл с данными предприятия для цифрового двойника</p>
        <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ marginBottom: 12 }} />
        {csvData && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr>{csvData[0]?.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
              <tbody>{csvData.slice(1, 6).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
            </table>
            <div className="alert alert-success mt-2">✅ Загружено строк: {csvData.length - 1}</div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600 }}>
            <h2 className="modal-title">Создать практику</h2>

            <div className="form-group">
              <label className="form-label">Название практики</label>
              <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Токарная обработка детали «Вал»" />
            </div>

            <div className="form-group">
              <label className="form-label">Сцена из библиотеки</label>
              <select className="form-select" value={form.sceneId} onChange={e => set('sceneId', e.target.value)}>
                <option value="">-- Выберите сцену --</option>
                {scenes.map(s => <option key={s.id} value={s.id}>{s.preview} {s.name}</option>)}
              </select>
            </div>

            {form.sceneId && scenes.find(s => s.id === form.sceneId) && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                {scenes.find(s => s.id === form.sceneId)?.description}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Группа студентов</label>
              <input className="form-input" value={form.group} onChange={e => set('group', e.target.value)} placeholder="ТМ-301 (или пусто = все группы)" />
            </div>

            <div className="form-group">
              <label className="form-label">Критерии оценки</label>
              <textarea className="form-input" rows={2} value={form.criteria} onChange={e => set('criteria', e.target.value)} placeholder="Соблюдение последовательности, точность параметров..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Режим</label>
                <select className="form-select" value={form.mode} onChange={e => set('mode', e.target.value)}>
                  <option value="training">📚 Обучение</option>
                  <option value="exam">📝 Экзамен</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Мин. успешных попыток (до экзамена)</label>
                <input type="number" className="form-input" value={form.requiredAttempts} onChange={e => set('requiredAttempts', Number(e.target.value))} min={1} max={10} />
              </div>
            </div>

            {scenes.find(s => s.id === form.sceneId)?.type === 'digital' && (
              <div className="form-group">
                <label className="form-label">Целевое снижение себестоимости (%)</label>
                <input type="number" className="form-input" value={form.targetCostReduction} onChange={e => set('targetCostReduction', Number(e.target.value))} min={1} max={30} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="showErrors" checked={form.showErrors} onChange={e => set('showErrors', e.target.checked)} />
              <label htmlFor="showErrors" style={{ fontSize: 14 }}>Показывать студентам историю ошибок</label>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate}>✅ Создать</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
