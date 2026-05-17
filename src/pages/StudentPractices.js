// src/pages/StudentPractices.js
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import WorkshopPractice from './WorkshopPractice';
import DigitalTwinPractice from './DigitalTwinPractice';

export default function StudentPractices() {
  const { user } = useAuth();
  const [practices, setPractices] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(null); // { practice, scene }

  useEffect(() => {
    const all = Storage.getPractices().filter(p => p.active && (p.group === user.group || !p.group));
    setPractices(all);
    setScenes(Storage.getScenes());
    setResults(Storage.getResultsForStudent(user.id));
  }, [user, active]);

  if (active) {
    const { practice, scene } = active;
    if (scene.type === 'workshop') {
      return <WorkshopPractice practice={practice} scene={scene} onFinish={() => setActive(null)} />;
    } else {
      return <DigitalTwinPractice practice={practice} scene={scene} onFinish={() => setActive(null)} />;
    }
  }

  const getScene = (id) => scenes.find(s => s.id === id);
  const getResults = (practiceId) => results.filter(r => r.practiceId === practiceId);
  const getBestScore = (practiceId) => {
    const rs = getResults(practiceId);
    return rs.length ? Math.max(...rs.map(r => r.score)) : null;
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Мои практики</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>Группа: <strong>{user.group || 'не указана'}</strong> · {practices.length} назначено</p>
      </div>

      {practices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Нет назначенных практик</div>
          <div style={{ color: '#6b7280' }}>Ожидайте назначения от преподавателя</div>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: 20 }}>
          {practices.map(practice => {
            const scene = getScene(practice.sceneId);
            if (!scene) return null;
            const bestScore = getBestScore(practice.id);
            const attemptCount = getResults(practice.id).length;
            return (
              <div key={practice.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 48, flexShrink: 0 }}>{scene.preview}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{practice.title}</div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>{scene.name}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`badge ${scene.type === 'workshop' ? 'badge-blue' : 'badge-orange'}`}>
                        {scene.type === 'workshop' ? '🔧 Виртуальный цех' : '🏭 Цифровой двойник'}
                      </span>
                      <span className={`badge ${practice.mode === 'training' ? 'badge-green' : 'badge-red'}`}>
                        {practice.mode === 'training' ? '📚 Обучение' : '📝 Экзамен'}
                      </span>
                    </div>
                  </div>
                </div>

                {practice.criteria && (
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#374151' }}>
                    <strong>Задача:</strong> {practice.criteria}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  {bestScore !== null ? (
                    <>
                      <div style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', borderRadius: 8, padding: '8px' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: bestScore >= 80 ? '#22c55e' : bestScore >= 60 ? '#f59e0b' : '#ef4444' }}>{bestScore}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Лучший балл</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center', background: '#eff6ff', borderRadius: 8, padding: '8px' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#2A7DE1' }}>{attemptCount}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Попыток</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: 8, padding: '8px 12px', color: '#9ca3af', fontSize: 13 }}>
                      Ещё не начато
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}
                    onClick={() => setActive({ practice, scene })}>
                    {bestScore !== null ? '🔄 Повторить' : '▶ Начать'}
                  </button>
                  {practice.mode === 'training' && bestScore !== null && (
                    <button className="btn btn-outline btn-sm"
                      onClick={() => setActive({ practice: { ...practice, mode: 'exam' }, scene })}>
                      📝 Экзамен
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
