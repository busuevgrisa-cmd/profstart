// src/pages/WorkshopPractice.js
import React, { useState, useRef } from 'react';
import WorkshopScene from '../components/WorkshopScene';
import ElectricalScene from '../components/ElectricalScene';
import WeldingScene from '../components/WeldingScene';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const ERROR_MSGS = {
  lathe: {
    chuck:         'Сначала закрепите заготовку в патроне!',
    control_panel: 'Сначала нужно настроить режимы резания',
    tool_holder:   'Установите режущий инструмент',
    start_button:  'Убедитесь, что заготовка закреплена и инструмент установлен',
    stop_button:   'Сначала выполните обработку детали',
    carriage:      'Включите шпиндель перед началом точения',
    lathe_body:    'Начните с осмотра оборудования',
  },
  electrical: {
    din_rail:     'Сначала проверьте отсутствие напряжения!',
    main_breaker: 'Сначала установите DIN-рейку',
    rcd:          'Сначала установите вводной автомат',
    breakers:     'Сначала установите УЗО',
    neutral_bus:  'Сначала установите все автоматы',
    ground_bus:   'Сначала смонтируйте нулевую шину',
    voltmeter:    'Сначала завершите монтаж всех шин и проводников',
    cable_entry:  'Начните с проверки отсутствия напряжения',
  },
  welding: {
    ventilation:      'Сначала наденьте СИЗ — безопасность прежде всего!',
    workpiece:        'Включите вентиляцию перед работой',
    ground_clamp:     'Сначала подготовьте заготовку',
    electrode_box:    'Сначала подключите обратный кабель',
    welder:           'Сначала выберите и вставьте электрод',
    electrode_holder: 'Настройте ток сварки на инверторе',
    grinder:          'Сначала выполните сварной шов',
    ppe:              'Начните с надевания средств защиты',
  },
};

function getErrorMsg(sceneType, clicked, expected, steps) {
  const msgs = ERROR_MSGS[sceneType] || {};
  const expectedStep = steps?.find(s => s.object === expected);
  if (expectedStep) {
    return `Неверный порядок! Сейчас: «${expectedStep.title}». ${msgs[expected] || ''}`;
  }
  return msgs[clicked] || 'Это действие сейчас не нужно';
}

function SceneRenderer({ sceneComponent, currentStep, onObjectClick, completedSteps, stateFlags }) {
  if (sceneComponent === 'electrical') {
    return (
      <ElectricalScene
        currentStep={currentStep}
        onObjectClick={onObjectClick}
        completedSteps={completedSteps}
        powered={stateFlags.powered}
      />
    );
  }
  if (sceneComponent === 'welding') {
    return (
      <WeldingScene
        currentStep={currentStep}
        onObjectClick={onObjectClick}
        completedSteps={completedSteps}
        welding={stateFlags.welding}
        weldDone={stateFlags.weldDone}
        current={stateFlags.current || 100}
      />
    );
  }
  return (
    <WorkshopScene
      currentStep={currentStep}
      onObjectClick={onObjectClick}
      completedSteps={completedSteps}
      spinning={stateFlags.spinning}
      workpieceVisible={stateFlags.workpieceVisible}
    />
  );
}

const SCENE_LABELS = {
  lathe: 'Токарный станок',
  electrical: 'Электрощит',
  welding: 'Сварочный пост',
};

export default function WorkshopPractice({ practice, scene, onFinish }) {
  const { user } = useAuth();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState(null);
  const [finished, setFinished] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const [startTime] = useState(Date.now());

  const [spinning, setSpinning] = useState(false);
  const [workpieceVisible, setWorkpieceVisible] = useState(false);
  const [powered, setPowered] = useState(false);
  const [welding, setWelding] = useState(false);
  const [weldDone, setWeldDone] = useState(false);
  const [weldCurrent, setWeldCurrent] = useState(100);

  const messageTimer = useRef(null);
  const isTraining = practice.mode === 'training';
  const steps = scene.steps || [];
  const currentStep = steps[currentStepIdx];
  const sceneComponent = scene.sceneComponent || 'lathe';

  const showMsg = (text, type = 'info', duration = 3000) => {
    setMessage({ text, type });
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), duration);
  };

  const applySceneEffect = (obj) => {
    if (obj === 'chuck') setWorkpieceVisible(true);
    if (obj === 'start_button') setSpinning(true);
    if (obj === 'stop_button') setSpinning(false);
    if (obj === 'voltmeter') setPowered(true);
    if (obj === 'welder') setWeldCurrent(100);
    if (obj === 'electrode_holder') {
      setWelding(true);
      setTimeout(() => setWelding(false), 3000);
    }
    if (obj === 'grinder') setWeldDone(true);
  };

  const handleObjectClick = (obj) => {
    if (finished) return;
    const expected = currentStep?.object;

    if (obj === expected) {
      const newCompleted = [...completedSteps, currentStep.title];
      setCompletedSteps(newCompleted);
      applySceneEffect(obj);

      if (currentStepIdx + 1 >= steps.length) {
        setFinished(true);
        saveResult(newCompleted, errors);
        showMsg('Все операции выполнены успешно!', 'success', 10000);
      } else {
        if (isTraining) {
          const next = steps[currentStepIdx + 1];
          showMsg(`Верно! Следующий шаг: ${next.title}`, 'success');
        }
        setCurrentStepIdx(i => i + 1);
      }
    } else {
      const errorMsg = getErrorMsg(sceneComponent, obj, expected, steps);
      const newError = { step: currentStep?.title, clicked: obj, expected, message: errorMsg, time: new Date().toISOString() };
      if (isTraining) {
        showMsg(errorMsg, 'error');
      } else {
        setErrors(e => [...e, newError]);
        showMsg('Ошибка зафиксирована', 'warning');
      }
    }
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
      sceneType: sceneComponent,
      mode: practice.mode,
      score,
      errors: errs,
      completedSteps: completed,
      duration,
      date: new Date().toISOString(),
    });
  };

  const score = Math.max(0, 100 - errors.length * 10);
  const progress = steps.length ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a' }}>
      {/* Top bar */}
      <div style={{ background: '#1e293b', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #334155' }}>
        <button className="btn btn-secondary btn-sm" onClick={onFinish} style={{ background: '#334155', color: '#94a3b8', border: 'none' }}>← Назад</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>{practice.title}</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>{scene.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ background: '#1e3a5f', color: '#93c5fd', padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600 }}>
            {SCENE_LABELS[sceneComponent] || 'Виртуальный цех'}
          </span>
          <span style={{ background: isTraining ? '#14532d' : '#7c2d12', color: isTraining ? '#86efac' : '#fca5a5', padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600 }}>
            {isTraining ? 'Обучение' : 'Экзамен'}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Ошибок: <strong style={{ color: errors.length > 0 ? '#f87171' : '#4ade80' }}>{errors.length}</strong></span>
          {!isTraining && <span style={{ color: '#94a3b8', fontSize: 13 }}>Балл: <strong style={{ color: '#93c5fd' }}>{score}</strong></span>}
          {isTraining && (
            <button className="btn btn-sm" style={{ background: '#1d4ed8', color: '#fff', border: 'none' }} onClick={() => setShowInstruction(true)}>
              Инструкция
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — steps */}
        <div style={{ width: 260, background: '#1e293b', padding: 16, overflowY: 'auto', borderRight: '1px solid #334155', flexShrink: 0 }}>
          <div style={{ color: '#475569', fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.6px' }}>
            Технологическая карта
          </div>
          {steps.map((step, i) => {
            const done = completedSteps.includes(step.title);
            const current = i === currentStepIdx && !finished;
            return (
              <div key={step.id} style={{
                padding: '10px 12px', marginBottom: 6, borderRadius: 8,
                background: done ? 'rgba(22,163,74,.12)' : current ? 'rgba(42,125,225,.18)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${done ? '#166534' : current ? '#2A7DE1' : '#1e293b'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`step-num ${done ? 'step-num-done' : current ? 'step-num-active' : 'step-num-pending'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span style={{ color: done ? '#4ade80' : current ? '#93c5fd' : '#64748b', fontSize: 13, fontWeight: current ? 700 : 400 }}>
                    {step.title}
                  </span>
                </div>
                {current && isTraining && (
                  <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(42,125,225,.12)', borderRadius: 6, fontSize: 12, color: '#7dd3fc', borderLeft: '2px solid #2A7DE1' }}>
                    {step.hint}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: 16 }}>
            <div style={{ color: '#475569', fontSize: 12, marginBottom: 6 }}>Прогресс: {progress}%</div>
            <div style={{ background: '#334155', borderRadius: 999, height: 5 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#22c55e', borderRadius: 999, transition: 'width .4s' }} />
            </div>
          </div>
        </div>

        {/* Main scene area */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SceneRenderer
            sceneComponent={sceneComponent}
            currentStep={isTraining && !finished ? currentStep : null}
            onObjectClick={handleObjectClick}
            completedSteps={completedSteps}
            stateFlags={{ spinning, workpieceVisible, powered, welding, weldDone, current: weldCurrent }}
          />

          {/* Message overlay */}
          {message && (
            <div style={{
              position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
              padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: message.type === 'success' ? 'rgba(22,163,74,.92)' : message.type === 'error' ? 'rgba(220,38,38,.92)' : message.type === 'warning' ? 'rgba(217,119,6,.92)' : 'rgba(42,125,225,.92)',
              color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,.3)', zIndex: 10,
              maxWidth: '68%', textAlign: 'center',
            }}>
              {message.text}
            </div>
          )}

          {/* Current step bar */}
          {isTraining && currentStep && !finished && (
            <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>Текущий шаг: {currentStep.title}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{currentStep.description}</div>
              </div>
              <div style={{ marginLeft: 'auto', background: 'rgba(22,163,74,.12)', border: '1px solid #166534', borderRadius: 7, padding: '5px 12px', color: '#4ade80', fontSize: 12 }}>
                Нажмите на подсвеченный объект
              </div>
            </div>
          )}

          {!isTraining && currentStep && !finished && (
            <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '11px 20px' }}>
              <div style={{ color: '#64748b', fontSize: 13 }}>Экзаменационный режим: выполняйте операции самостоятельно согласно технологической карте</div>
            </div>
          )}
        </div>
      </div>

      {/* Finished modal */}
      {finished && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: score >= 80 ? '#dcfce7' : score >= 60 ? '#fef3c7' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800,
                color: score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626',
              }}>
                {score}
              </div>
              <h2 className="modal-title" style={{ margin: 0 }}>Практика завершена</h2>
            </div>
            <div className="grid grid-3" style={{ marginBottom: 20 }}>
              <div className="card stat-card">
                <div className="stat-value" style={{ color: score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626' }}>{score}</div>
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
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Допущенные ошибки:</div>
                {errors.map((e, i) => (
                  <div key={i} className="alert alert-error" style={{ marginBottom: 6 }}>
                    <strong>Шаг «{e.step}»:</strong> {e.message}
                  </div>
                ))}
              </div>
            )}
            {isTraining ? (
              <div className="alert alert-info">В обучающем режиме ошибки не влияют на оценку. Попробуйте экзаменационный режим!</div>
            ) : (
              <div className="alert alert-success">Результат сохранён в профиле и передан преподавателю.</div>
            )}
            <button className="btn btn-primary w-full mt-4" onClick={onFinish}>Вернуться к практикам</button>
          </div>
        </div>
      )}

      {/* Instruction modal */}
      {showInstruction && (
        <div className="modal-overlay" onClick={() => setShowInstruction(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 className="modal-title">Пошаговая инструкция</h2>
            {steps.map((s, i) => (
              <div key={s.id} style={{ marginBottom: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2A7DE1' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{i + 1}. {s.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.description}</div>
                <div style={{ fontSize: 12, color: '#2A7DE1', marginTop: 4 }}>{s.hint}</div>
              </div>
            ))}
            <button className="btn btn-primary w-full mt-4" onClick={() => setShowInstruction(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
