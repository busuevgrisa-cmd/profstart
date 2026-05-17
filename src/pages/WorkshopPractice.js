// src/pages/WorkshopPractice.js
import React, { useState, useEffect, useRef } from 'react';
import WorkshopScene from '../components/WorkshopScene';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

export default function WorkshopPractice({ practice, scene, onFinish }) {
  const { user } = useAuth();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState(null); // {text, type}
  const [finished, setFinished] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [workpieceVisible, setWorkpieceVisible] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const [startTime] = useState(Date.now());
  const isTraining = practice.mode === 'training';
  const steps = scene.steps;
  const currentStep = steps[currentStepIdx];
  const messageTimer = useRef(null);

  const showMsg = (text, type = 'info', duration = 3000) => {
    setMessage({ text, type });
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), duration);
  };

  const handleObjectClick = (obj) => {
    if (finished) return;
    const expected = currentStep?.object;

    if (obj === expected) {
      // Correct action
      const newCompleted = [...completedSteps, currentStep.title];
      setCompletedSteps(newCompleted);

      // Special effects
      if (obj === 'chuck') setWorkpieceVisible(true);
      if (obj === 'start_button') setSpinning(true);
      if (obj === 'stop_button') setSpinning(false);

      if (currentStepIdx + 1 >= steps.length) {
        // Finished!
        setFinished(true);
        saveResult(newCompleted, errors);
        showMsg('🎉 Отлично! Все операции выполнены успешно!', 'success', 10000);
      } else {
        if (isTraining) {
          const next = steps[currentStepIdx + 1];
          showMsg(`✅ Отлично! Теперь: ${next.title}`, 'success');
        }
        setCurrentStepIdx(i => i + 1);
      }
    } else {
      // Wrong action
      const errorMsg = getErrorMessage(obj, expected);
      const newError = { step: currentStep?.title, clicked: obj, expected, message: errorMsg, time: new Date().toISOString() };

      if (isTraining) {
        showMsg(`❌ ${errorMsg}`, 'error');
        // In training mode, don't count errors toward final grade
      } else {
        setErrors(e => [...e, newError]);
        showMsg(`⚠️ Ошибка зафиксирована`, 'warning');
      }
    }
  };

  const getErrorMessage = (clicked, expected) => {
    const msgs = {
      chuck: 'Сначала закрепите заготовку в патроне!',
      control_panel: 'Сначала нужно настроить режимы резания',
      tool_holder: 'Установите режущий инструмент',
      start_button: 'Убедитесь, что заготовка закреплена и инструмент установлен',
      stop_button: 'Сначала выполните обработку детали',
      carriage: 'Включите шпиндель перед началом точения',
      lathe_body: 'Начните с осмотра оборудования',
    };
    if (expected) {
      return `Неверный порядок! Сейчас нужно выполнить: "${steps.find(s => s.object === expected)?.title}". ${msgs[expected] || ''}`;
    }
    return msgs[clicked] || 'Это действие сейчас не нужно';
  };

  const saveResult = (completed, errs) => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const score = Math.max(0, 100 - errs.length * 10);
    Storage.addResult({
      id: `result-${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      practiceId: practice.id,
      practiceTitle: practice.title,
      sceneType: 'workshop',
      mode: practice.mode,
      score,
      errors: errs,
      completedSteps: completed,
      duration,
      date: new Date().toISOString(),
    });
  };

  const score = Math.max(0, 100 - errors.length * 10);
  const progress = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a' }}>
      {/* Top bar */}
      <div style={{ background: '#1e293b', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #334155' }}>
        <button className="btn btn-secondary btn-sm" onClick={onFinish}>← Назад</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>{practice.title}</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{scene.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ background: isTraining ? '#166534' : '#7c2d12', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
            {isTraining ? '📚 Обучение' : '📝 Экзамен'}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Ошибок: <strong style={{ color: errors.length > 0 ? '#f87171' : '#4ade80' }}>{errors.length}</strong></span>
          {!isTraining && <span style={{ color: '#94a3b8', fontSize: 13 }}>Балл: <strong style={{ color: '#60a5fa' }}>{score}</strong></span>}
          {isTraining && (
            <button className="btn btn-sm" style={{ background: '#1d4ed8', color: '#fff' }} onClick={() => setShowInstruction(true)}>
              📋 Инструкция
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel - steps */}
        <div style={{ width: 260, background: '#1e293b', padding: 16, overflowY: 'auto', borderRight: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>ТЕХНОЛОГИЧЕСКАЯ КАРТА</div>
          {steps.map((step, i) => {
            const done = completedSteps.includes(step.title);
            const current = i === currentStepIdx && !finished;
            return (
              <div key={step.id} style={{
                padding: '10px 12px', marginBottom: 6, borderRadius: 8,
                background: done ? 'rgba(34,197,94,.15)' : current ? 'rgba(42,125,225,.2)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${done ? '#22c55e' : current ? '#2A7DE1' : '#334155'}`,
                transition: 'all .2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{done ? '✅' : current ? '▶️' : `${i + 1}`}</span>
                  <span style={{ color: done ? '#4ade80' : current ? '#60a5fa' : '#94a3b8', fontSize: 13, fontWeight: current ? 700 : 400 }}>
                    {step.title}
                  </span>
                </div>
                {current && isTraining && (
                  <div style={{ marginTop: 6, padding: '6px 8px', background: 'rgba(42,125,225,.15)', borderRadius: 6, fontSize: 12, color: '#93c5fd' }}>
                    💡 {step.hint}
                  </div>
                )}
              </div>
            );
          })}

          {/* Progress */}
          <div style={{ marginTop: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Прогресс: {progress}%</div>
            <div style={{ background: '#334155', borderRadius: 999, height: 6 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#22c55e', borderRadius: 999, transition: 'width .4s' }} />
            </div>
          </div>
        </div>

        {/* Main 3D area */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <WorkshopScene
            currentStep={isTraining && !finished ? currentStep : null}
            onObjectClick={handleObjectClick}
            completedSteps={completedSteps}
            spinning={spinning}
            workpieceVisible={workpieceVisible}
          />

          {/* Message overlay */}
          {message && (
            <div style={{
              position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
              padding: '12px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              background: message.type === 'success' ? 'rgba(34,197,94,.9)' : message.type === 'error' ? 'rgba(239,68,68,.9)' : message.type === 'warning' ? 'rgba(245,158,11,.9)' : 'rgba(42,125,225,.9)',
              color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,.3)', zIndex: 10,
              maxWidth: '70%', textAlign: 'center',
            }}>
              {message.text}
            </div>
          )}

          {/* Current step hint bar (training) */}
          {isTraining && currentStep && !finished && (
            <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>Текущий шаг: {currentStep.title}</div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>{currentStep.description}</div>
              </div>
              <div style={{ marginLeft: 'auto', background: 'rgba(34,197,94,.15)', border: '1px solid #22c55e', borderRadius: 8, padding: '6px 12px', color: '#4ade80', fontSize: 13 }}>
                Нажмите на подсвеченный объект
              </div>
            </div>
          )}

          {!isTraining && currentStep && !finished && (
            <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '12px 20px' }}>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Экзаменационный режим: выполняйте операции самостоятельно согласно технологической карте</div>
            </div>
          )}
        </div>
      </div>

      {/* Finished modal */}
      {finished && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>{score >= 80 ? '🏆' : score >= 60 ? '👍' : '📚'}</div>
              <h2 className="modal-title" style={{ margin: 0 }}>Практика завершена!</h2>
            </div>
            <div className="grid grid-3" style={{ marginBottom: 20 }}>
              <div className="card stat-card">
                <div className="stat-value" style={{ color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444' }}>{score}</div>
                <div className="stat-label">Баллов</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{errors.length}</div>
                <div className="stat-label">Ошибок</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{completedSteps.length}/{steps.length}</div>
                <div className="stat-label">Шагов</div>
              </div>
            </div>
            {errors.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Допущенные ошибки:</div>
                {errors.map((e, i) => (
                  <div key={i} className="alert alert-error" style={{ marginBottom: 6 }}>
                    <strong>Шаг «{e.step}»:</strong> {e.message}
                  </div>
                ))}
              </div>
            )}
            {isTraining ? (
              <div className="alert alert-info">В обучающем режиме ошибки не влияют на итоговую оценку. Попробуйте экзаменационный режим!</div>
            ) : (
              <div className="alert alert-success">Результат сохранён в вашем профиле и передан преподавателю.</div>
            )}
            <button className="btn btn-primary w-full mt-4" onClick={onFinish}>Вернуться к практикам</button>
          </div>
        </div>
      )}

      {/* Instruction modal */}
      {showInstruction && (
        <div className="modal-overlay" onClick={() => setShowInstruction(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">📋 Пошаговая инструкция</h2>
            {steps.map((s, i) => (
              <div key={s.id} style={{ marginBottom: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2A7DE1' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{i + 1}. {s.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.description}</div>
                <div style={{ fontSize: 12, color: '#2A7DE1', marginTop: 4 }}>💡 {s.hint}</div>
              </div>
            ))}
            <button className="btn btn-primary w-full mt-4" onClick={() => setShowInstruction(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
