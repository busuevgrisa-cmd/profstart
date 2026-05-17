// src/pages/DigitalTwinPractice.js — ENHANCED v2 (5 tasks)
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

// ─── TASK DEFINITIONS ──────────────────────────────────────────────────────────
const TASKS = [
  {
    id: 'cost',
    title: '📦 Задание 1: Снижение себестоимости',
    subtitle: 'Оптимизируйте закупки и производство',
    description: 'Снизьте себестоимость единицы продукции минимум на 8% за счёт управления закупками, персоналом и накладными расходами.',
    goal: 'Снижение себестоимости ≥ 8%',
    icon: '📦',
    color: '#2A7DE1',
  },
  {
    id: 'shifts',
    title: '👷 Задание 2: Оптимизация смен',
    subtitle: 'Максимизируйте прибыль при управлении персоналом',
    description: 'Подберите оптимальное число смен и ФОТ так, чтобы прибыль превысила 3 500 000 ₽ при сохранении объёма производства ≥ 900 ед.',
    goal: 'Прибыль > 3 500 000 ₽ и объём ≥ 900 ед.',
    icon: '👷',
    color: '#f59e0b',
  },
  {
    id: 'price',
    title: '💰 Задание 3: Ценообразование',
    subtitle: 'Найдите оптимальную цену продажи',
    description: 'Найдите такую цену реализации, при которой маржинальность (маржа) превысит 30%, не снижая объём продаж ниже 800 ед.',
    goal: 'Маржа > 30% и объём производства ≥ 800 ед.',
    icon: '💰',
    color: '#22c55e',
  },
  {
    id: 'invest',
    title: '🏭 Задание 4: Инвестиции в оборудование',
    subtitle: 'Оцените целесообразность капиталовложений',
    description: 'Вы планируете закупить новое оборудование за 2 000 000 ₽. Настройте параметры так, чтобы дополнительная прибыль за год покрывала инвестицию и давала ROI ≥ 20%.',
    goal: 'ROI инвестиции ≥ 20% (допприбыль / 2 000 000)',
    icon: '🏭',
    color: '#a855f7',
  },
  {
    id: 'crisis',
    title: '⚠️ Задание 5: Антикризисный план',
    subtitle: 'Кризис поставок — дефицит сырья',
    description: 'Поставщик сократил объём поставок: максимальный объём закупки — 600 ед. При этих ограничениях добейтесь, чтобы предприятие оставалось прибыльным (прибыль > 0) и маржа не опускалась ниже 10%.',
    goal: 'Прибыль > 0 и маржа ≥ 10% при закупке ≤ 600 ед.',
    icon: '⚠️',
    color: '#ef4444',
  },
];

// ─── BASE VALUES ───────────────────────────────────────────────────────────────
const BASE = {
  rawMaterialCost: 5000,
  laborCost: 3000,
  overheadCost: 1500,
  productionVolume: 1000,
  salePrice: 12000,
  purchaseVolume: 800,
  shifts: 2,
  warehouseCost: 500,
};

const TOOLTIPS = {
  rawMaterialCost: 'Стоимость сырья на ед. При 900+ закупке — скидка 4%, при 1000+ — 8%.',
  laborCost: 'Затраты на оплату труда. Зависит от числа смен.',
  overheadCost: 'Постоянные расходы: аренда, амортизация, коммунальные.',
  productionVolume: 'Объём выпуска в единицах. Снижает себестоимость при росте.',
  salePrice: 'Цена реализации. Влияет на выручку и маржу.',
  purchaseVolume: 'Объём закупки. 900+ → −4%, 1000+ → −8% к цене сырья.',
  shifts: '1 смена — −15% ФОТ, 2 смены — норма, 3 смены — +15% ФОТ.',
  warehouseCost: 'Расходы на склад. Растут пропорционально закупке.',
};

function calcMetrics(params) {
  const volDiscount = params.purchaseVolume >= 1000 ? 0.92 : params.purchaseVolume >= 900 ? 0.96 : 1;
  const rawEff = params.rawMaterialCost * volDiscount;
  const shiftMult = params.shifts === 3 ? 1.15 : params.shifts === 1 ? 0.85 : 1;
  const laborEff = params.laborCost * shiftMult;
  const warehouse = params.warehouseCost * (params.purchaseVolume / 800);
  const costPerUnit = (rawEff + laborEff + params.overheadCost + warehouse) / params.productionVolume;
  const revenue = params.productionVolume * params.salePrice;
  const totalCost = costPerUnit * params.productionVolume;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return {
    costPerUnit: Math.round(costPerUnit),
    revenue: Math.round(revenue),
    totalCost: Math.round(totalCost),
    profit: Math.round(profit),
    margin: Math.round(margin * 10) / 10,
    rawEff: Math.round(rawEff),
    laborEff: Math.round(laborEff),
    warehouse: Math.round(warehouse),
  };
}

function checkGoal(taskId, params, metrics, baseMetrics) {
  const costReduction = ((baseMetrics.costPerUnit - metrics.costPerUnit) / baseMetrics.costPerUnit) * 100;
  const extraProfit = metrics.profit - baseMetrics.profit;
  const roi = extraProfit / 2000000 * 100;
  switch (taskId) {
    case 'cost':   return costReduction >= 8;
    case 'shifts': return metrics.profit > 3500000 && params.productionVolume >= 900;
    case 'price':  return metrics.margin > 30 && params.productionVolume >= 800;
    case 'invest': return roi >= 20;
    case 'crisis': return params.purchaseVolume <= 600 && metrics.profit > 0 && metrics.margin >= 10;
    default:       return false;
  }
}

function getProgressValue(taskId, params, metrics, baseMetrics) {
  const costReduction = ((baseMetrics.costPerUnit - metrics.costPerUnit) / baseMetrics.costPerUnit) * 100;
  const extraProfit = metrics.profit - baseMetrics.profit;
  const roi = extraProfit / 2000000 * 100;
  switch (taskId) {
    case 'cost':   return { val: costReduction.toFixed(1), target: 8, unit: '%', label: 'Снижение с/с' };
    case 'shifts': return { val: (metrics.profit/1000).toFixed(0), target: 3500, unit: 'K₽', label: 'Прибыль' };
    case 'price':  return { val: metrics.margin.toFixed(1), target: 30, unit: '%', label: 'Маржа' };
    case 'invest': return { val: roi.toFixed(1), target: 20, unit: '%', label: 'ROI' };
    case 'crisis': return { val: metrics.margin.toFixed(1), target: 10, unit: '%', label: 'Маржа (кризис)' };
    default:       return { val: 0, target: 100, unit: '', label: '' };
  }
}

// ─── STYLED SLIDER ─────────────────────────────────────────────────────────────
function SliderParam({ label, tooltip, paramKey, min, max, step, value, unit, onChange, isTraining, warn, locked }) {
  const pct = ((value - min) / (max - min)) * 100;
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ marginBottom: 18, opacity: locked ? 0.5 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
          {isTraining && (
            <span style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#2A7DE1', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>?</span>
              {showTip && (
                <div style={{ position: 'absolute', left: '120%', top: '50%', transform: 'translateY(-50%)', background: '#1e293b', color: '#e2e8f0', fontSize: 12, padding: '8px 12px', borderRadius: 8, width: 220, zIndex: 99, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', lineHeight: 1.5 }}>
                  {tooltip}
                </div>
              )}
            </span>
          )}
          {locked && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>🔒 Ограничено</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 15, fontWeight: 800,
            color: warn ? '#ef4444' : '#2A7DE1',
            background: warn ? '#fef2f2' : '#eff6ff',
            padding: '2px 10px', borderRadius: 6,
            transition: 'all .2s'
          }}>
            {typeof value === 'number' && value >= 1000 ? value.toLocaleString('ru') : value}{unit}
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
        {/* Track background */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, background: '#e5e7eb' }}/>
        {/* Track fill */}
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 6, borderRadius: 3, background: warn ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#2A7DE1,#60a5fa)', transition: 'width .15s' }}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(paramKey, Number(e.target.value))}
          style={{ position: 'absolute', width: '100%', opacity: 0, height: 22, cursor: 'pointer', zIndex: 2 }}/>
        {/* Thumb visual */}
        <div style={{ position: 'absolute', left: `calc(${pct}% - 10px)`, width: 20, height: 20, borderRadius: '50%', background: warn ? '#ef4444' : '#2A7DE1', border: '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.25)', transition: 'left .1s', pointerEvents: 'none' }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>{typeof min === 'number' && min >= 1000 ? min.toLocaleString('ru') : min}{unit}</span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>{typeof max === 'number' && max >= 1000 ? max.toLocaleString('ru') : max}{unit}</span>
      </div>
    </div>
  );
}

// ─── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, deltaLabel, positive, big }) {
  const up = delta > 0;
  const good = positive ? up : !up;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: big ? '20px 18px' : '14px 16px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: big ? 28 : 22, fontWeight: 800, color: '#111', lineHeight: 1.1 }}>{value}</div>
      {delta !== undefined && (
        <div style={{ fontSize: 12, fontWeight: 600, color: good ? '#22c55e' : '#ef4444' }}>
          {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}{deltaLabel}
          <span style={{ color: '#9ca3af', fontWeight: 400 }}> к базе</span>
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS RING ─────────────────────────────────────────────────────────────
function ProgressRing({ pct, color, size = 72 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .5s' }}/>
    </svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DigitalTwinPractice({ practice, scene, onFinish }) {
  const { user } = useAuth();
  const isTraining = practice.mode === 'training';

  const [activeTask, setActiveTask] = useState(0);
  const [completedTasks, setCompletedTasks] = useState({});
  const [taskPoints, setTaskPoints] = useState({});

  const [params, setParams] = useState({ ...BASE });
  const [history, setHistory] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [appliedOnce, setAppliedOnce] = useState(false);

  const task = TASKS[activeTask];
  const baseMetrics = calcMetrics(BASE);
  const metrics = calcMetrics(params);
  const achieved = checkGoal(task.id, params, metrics, baseMetrics);
  const progress = getProgressValue(task.id, params, metrics, baseMetrics);
  const progressPct = Math.min(100, (parseFloat(progress.val) / progress.target) * 100);
  const costReduction = ((baseMetrics.costPerUnit - metrics.costPerUnit) / baseMetrics.costPerUnit) * 100;
  const extraProfit = metrics.profit - baseMetrics.profit;
  const roi = extraProfit / 2000000 * 100;

  const isCrisis = task.id === 'crisis';

  const set = useCallback((key, val) => {
    setParams(p => ({ ...p, [key]: val }));
  }, []);

  const handleApply = () => {
    const entry = { attempt: attempts + 1, ...metrics, costReduction: costReduction.toFixed(1), taskId: task.id };
    setHistory(h => [...h, entry]);
    setAttempts(a => a + 1);
    setAppliedOnce(true);
    if (!achieved && !isTraining) {
      setErrors(e => [...e, { taskId: task.id, attempt: attempts + 1 }]);
    }
  };

  const handleCompleteTask = () => {
    if (!appliedOnce) return;
    const pts = achieved ? Math.max(60, 100 - errors.filter(e => e.taskId === task.id).length * 5) : (isTraining ? 40 : 20);
    setCompletedTasks(c => ({ ...c, [task.id]: achieved }));
    setTaskPoints(p => ({ ...p, [task.id]: pts }));
    if (activeTask < TASKS.length - 1) {
      setActiveTask(i => i + 1);
      setParams({ ...BASE });
      setAppliedOnce(false);
    }
  };

  const handleFinish = () => {
    setFinished(true);
    const totalScore = Math.round(Object.values(taskPoints).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(taskPoints).length));
    const duration = Math.round((Date.now() - startTime) / 1000);
    Storage.addResult({
      id: `result-${Date.now()}`,
      studentId: user.id, studentName: user.name,
      practiceId: practice.id, practiceTitle: practice.title,
      sceneType: 'digital', mode: practice.mode,
      score: totalScore, errors,
      completedTasks, taskPoints,
      duration, date: new Date().toISOString(),
    });
  };

  const chartData = [
    { name: 'База', costPerUnit: baseMetrics.costPerUnit, profit: Math.round(baseMetrics.profit / 1000) },
    { name: 'Текущее', costPerUnit: metrics.costPerUnit, profit: Math.round(metrics.profit / 1000) },
  ];

  const structureData = [
    { name: 'Сырьё', value: metrics.rawEff },
    { name: 'Труд', value: metrics.laborEff },
    { name: 'Накладные', value: params.overheadCost },
    { name: 'Склад', value: metrics.warehouse },
  ];

  const totalDone = Object.keys(completedTasks).length;
  const totalPoints = Object.values(taskPoints).reduce((a, b) => a + b, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      {/* ─── TOP BAR ─── */}
      <div style={{ background: '#fff', borderBottom: '2px solid #2A7DE1', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
        <button className="btn btn-secondary btn-sm" onClick={onFinish}>← Назад</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{practice.title}</div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>Цифровой двойник «МеталлПром» · {scene.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2A7DE1' }}>{totalDone}/{TASKS.length}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>заданий</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{totalPoints}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>баллов</div>
          </div>
          <span style={{ background: isTraining ? '#dcfce7' : '#fef3c7', color: isTraining ? '#166534' : '#92400e', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
            {isTraining ? '📚 Обучение' : '📝 Экзамен'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        {/* ─── SIDEBAR: TASK LIST ─── */}
        <div style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', overflowY: 'auto', padding: '16px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Задания</div>
          {TASKS.map((t, i) => {
            const done = completedTasks[t.id] !== undefined;
            const success = completedTasks[t.id] === true;
            const active = i === activeTask;
            return (
              <div key={t.id} onClick={() => { if (done || i <= activeTask) { setActiveTask(i); setParams({ ...BASE }); setAppliedOnce(false); } }}
                style={{
                  padding: '10px 12px', marginBottom: 8, borderRadius: 10, cursor: (done || i <= activeTask) ? 'pointer' : 'not-allowed',
                  background: active ? '#eff6ff' : done ? (success ? '#f0fdf4' : '#fef2f2') : '#f9fafb',
                  border: `2px solid ${active ? '#2A7DE1' : done ? (success ? '#22c55e' : '#ef4444') : '#e5e7eb'}`,
                  opacity: !done && i > activeTask ? 0.45 : 1,
                  transition: 'all .2s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#2A7DE1' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {i + 1}. {t.id === 'cost' ? 'Себестоимость' : t.id === 'shifts' ? 'Смены' : t.id === 'price' ? 'Цена' : t.id === 'invest' ? 'Инвестиции' : 'Антикризис'}
                    </div>
                    {done && <div style={{ fontSize: 11, color: success ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{success ? `✓ ${taskPoints[t.id]} баллов` : `✗ ${taskPoints[t.id]} баллов`}</div>}
                    {active && !done && <div style={{ fontSize: 11, color: '#2A7DE1' }}>▶ Выполняется</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Overall score */}
          <div style={{ marginTop: 16, padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Итого баллов</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2A7DE1' }}>{totalPoints}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>из {TASKS.length * 100}</div>
          </div>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Task header */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 20, border: `2px solid ${task.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ fontSize: 40 }}>{task.icon}</span>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{task.title}</h2>
                <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>{task.description}</p>
              </div>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <ProgressRing pct={progressPct} color={achieved ? '#22c55e' : task.color} size={76}/>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 13, fontWeight: 800, color: achieved ? '#22c55e' : task.color }}>
                  {progress.val}{progress.unit}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: achieved ? '#f0fdf4' : '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{achieved ? '✅' : '🎯'}</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: achieved ? '#166534' : '#1d4ed8' }}>Цель: </span>
                <span style={{ fontSize: 13, color: achieved ? '#166534' : '#374151' }}>{task.goal}</span>
              </div>
              {achieved && <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#22c55e', fontSize: 14 }}>ДОСТИГНУТА!</span>}
            </div>
            {isCrisis && isTraining && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#b91c1c', borderLeft: '3px solid #ef4444' }}>
                ⚠️ Кризис поставок! Ползунок объёма закупки заблокирован на уровне ≤ 600 ед.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
            {/* ─── LEFT: SLIDERS ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '20px 20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>⚙️ Производство</div>
                <SliderParam label="Объём производства" tooltip={TOOLTIPS.productionVolume} paramKey="productionVolume"
                  min={500} max={2000} step={50} value={params.productionVolume} unit=" ед."
                  onChange={set} isTraining={isTraining}/>
                <SliderParam label="Цена продажи" tooltip={TOOLTIPS.salePrice} paramKey="salePrice"
                  min={8000} max={20000} step={500} value={params.salePrice} unit=" ₽"
                  onChange={set} isTraining={isTraining}/>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: '20px 20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>📦 Закупки</div>
                <SliderParam label="Стоим. сырья (ед.)" tooltip={TOOLTIPS.rawMaterialCost} paramKey="rawMaterialCost"
                  min={2000} max={10000} step={100} value={params.rawMaterialCost} unit=" ₽"
                  onChange={set} isTraining={isTraining}/>
                <SliderParam label="Объём закупки" tooltip={TOOLTIPS.purchaseVolume} paramKey="purchaseVolume"
                  min={isCrisis ? 300 : 500} max={isCrisis ? 600 : 1500} step={50} value={isCrisis ? Math.min(params.purchaseVolume, 600) : params.purchaseVolume} unit=" ед."
                  onChange={(k, v) => set(k, isCrisis ? Math.min(v, 600) : v)} isTraining={isTraining}
                  warn={isCrisis && params.purchaseVolume > 580} locked={false}/>
                {params.purchaseVolume >= 900 && <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginTop: -10, marginBottom: 10 }}>✓ Скидка {params.purchaseVolume >= 1000 ? '8%' : '4%'} поставщика активна</div>}
                <SliderParam label="Складские расходы" tooltip={TOOLTIPS.warehouseCost} paramKey="warehouseCost"
                  min={200} max={1500} step={50} value={params.warehouseCost} unit=" ₽"
                  onChange={set} isTraining={isTraining}/>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: '20px 20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>👷 Персонал</div>
                <SliderParam label="ФОТ на ед. продукции" tooltip={TOOLTIPS.laborCost} paramKey="laborCost"
                  min={1000} max={6000} step={100} value={params.laborCost} unit=" ₽"
                  onChange={set} isTraining={isTraining}/>
                {/* Shifts selector */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Смен в сутки</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3].map(n => (
                      <button key={n} onClick={() => set('shifts', n)} style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${params.shifts === n ? '#2A7DE1' : '#e5e7eb'}`,
                        background: params.shifts === n ? '#2A7DE1' : '#f9fafb', color: params.shifts === n ? '#fff' : '#374151',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .15s',
                      }}>
                        {n}<br/><span style={{ fontSize: 10, fontWeight: 400 }}>{n === 1 ? 'эконом' : n === 2 ? 'норма' : 'макс'}</span>
                      </button>
                    ))}
                  </div>
                  {params.shifts === 3 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6, fontWeight: 600 }}>⚠️ Надбавка к ФОТ +15%</div>}
                  {params.shifts === 1 && <div style={{ fontSize: 11, color: '#22c55e', marginTop: 6, fontWeight: 600 }}>✓ Экономия ФОТ −15%</div>}
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: '20px 20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>🏗 Накладные</div>
                <SliderParam label="Накладные расходы" tooltip={TOOLTIPS.overheadCost} paramKey="overheadCost"
                  min={500} max={5000} step={100} value={params.overheadCost} unit=" ₽"
                  onChange={set} isTraining={isTraining}/>
              </div>

              <button onClick={handleApply} style={{
                width: '100%', padding: '14px 0', borderRadius: 10, background: '#2A7DE1', color: '#fff',
                border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(42,125,225,0.3)',
                transition: 'background .2s',
              }}>
                🔄 Рассчитать
              </button>

              {appliedOnce && (
                <button onClick={handleCompleteTask} style={{
                  width: '100%', padding: '14px 0', borderRadius: 10,
                  background: achieved ? '#22c55e' : isTraining ? '#f59e0b' : '#9ca3af',
                  color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: achieved || isTraining ? 'pointer' : 'not-allowed',
                  opacity: (!achieved && !isTraining) ? 0.6 : 1,
                }}>
                  {achieved ? '✅ Завершить задание' : isTraining ? '📚 Перейти к следующему' : `Нужно: ${task.goal}`}
                </button>
              )}
            </div>

            {/* ─── RIGHT: METRICS + CHARTS ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* KPI grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <KpiCard label="Себестоимость/ед" value={`${metrics.costPerUnit.toLocaleString('ru')} ₽`}
                  delta={-costReduction} deltaLabel="%" positive={false}/>
                <KpiCard label="Прибыль" value={`${(metrics.profit/1000).toFixed(0)}K ₽`}
                  delta={extraProfit/1000} deltaLabel="K ₽" positive={true}/>
                <KpiCard label="Маржа" value={`${metrics.margin}%`}
                  delta={metrics.margin - baseMetrics.margin} deltaLabel="%" positive={true}/>
                <KpiCard label="Выручка" value={`${(metrics.revenue/1000).toFixed(0)}K ₽`}
                  delta={(metrics.revenue - baseMetrics.revenue) / baseMetrics.revenue * 100} deltaLabel="%" positive={true}/>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{progress.label}</span>
                  <span style={{ fontWeight: 800, color: achieved ? '#22c55e' : task.color, fontSize: 16 }}>
                    {progress.val}{progress.unit} / {progress.target}{progress.unit}
                  </span>
                </div>
                <div style={{ background: '#e5e7eb', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: achieved ? '#22c55e' : `linear-gradient(90deg,${task.color},#60a5fa)`, borderRadius: 99, transition: 'width .5s' }}/>
                </div>
                {isTraining && !achieved && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                    💡 {task.id === 'cost' ? 'Увеличьте объём закупки для скидки поставщика, уменьшите ФОТ или накладные.' :
                        task.id === 'shifts' ? 'Увеличьте объём производства и цену при 2–3 сменах.' :
                        task.id === 'price' ? 'Поднимите цену продажи при контроле объёма.' :
                        task.id === 'invest' ? 'Нарастите объём и снизьте себестоимость для дополнительной прибыли.' :
                        'Снижайте себестоимость через оптимизацию ФОТ и накладных при закупке ≤600.'}
                  </div>
                )}
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '16px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#374151' }}>📊 База vs Текущее</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                      <YAxis tick={{ fontSize: 10 }}/>
                      <Tooltip formatter={(v, n) => [v.toLocaleString('ru'), n === 'costPerUnit' ? 'Себест. ₽' : 'Прибыль тыс.₽']}/>
                      <Bar dataKey="costPerUnit" fill="#ef4444" name="Себестоимость" radius={[4,4,0,0]}/>
                      <Bar dataKey="profit" fill="#22c55e" name="Прибыль" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: '#fff', borderRadius: 12, padding: '16px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#374151' }}>🥧 Структура затрат</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {structureData.map((d, i) => {
                      const pct2 = (d.value / metrics.totalCost * 100) || 0;
                      const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6'];
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                            <span style={{ color: '#374151' }}>{d.name}</span>
                            <span style={{ fontWeight: 700, color: colors[i] }}>{pct2.toFixed(0)}%</span>
                          </div>
                          <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${pct2}%`, height: '100%', background: colors[i], borderRadius: 4, transition: 'width .4s' }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: '#9ca3af' }}>Итого затрат: {metrics.totalCost.toLocaleString('ru')} ₽</div>
                </div>
              </div>

              {/* ROI panel for invest task */}
              {task.id === 'invest' && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #a855f7' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🏭 Анализ инвестиции (2 000 000 ₽)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <KpiCard label="Доп. прибыль" value={`${(extraProfit/1000).toFixed(0)}K ₽`} delta={undefined}/>
                    <KpiCard label="ROI" value={`${roi.toFixed(1)}%`} delta={undefined}/>
                    <KpiCard label="Срок окупаемости" value={extraProfit > 0 ? `${(2000000/extraProfit).toFixed(1)} лет` : '∞'} delta={undefined}/>
                  </div>
                </div>
              )}

              {/* History table */}
              {history.filter(h => h.taskId === task.id).length > 0 && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#374151' }}>📈 История расчётов</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', color: '#6b7280' }}>#</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#6b7280' }}>Себест.</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#6b7280' }}>Прибыль</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#6b7280' }}>Маржа</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', color: '#6b7280' }}>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.filter(h => h.taskId === task.id).slice(-5).map((h, i) => {
                          const ok = checkGoal(task.id, BASE, h, baseMetrics); // approximate
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '6px 10px', color: '#6b7280' }}>{h.attempt}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{h.costPerUnit?.toLocaleString('ru')} ₽</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{(h.profit/1000)?.toFixed(0)}K ₽</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{h.margin}%</td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: h.margin > 0 ? '#f0fdf4' : '#fef2f2', color: h.margin > 0 ? '#22c55e' : '#ef4444' }}>
                                  ●
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Finish all tasks button */}
          {totalDone === TASKS.length && !finished && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button onClick={handleFinish} style={{ padding: '16px 48px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 17, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }}>
                🏆 Завершить практику и сохранить результат
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── FINISH MODAL ─── */}
      {finished && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 60 }}>🏆</div>
              <h2 className="modal-title" style={{ margin: '8px 0 4px' }}>Практика завершена!</h2>
              <p style={{ color: '#6b7280', margin: 0 }}>Цифровой двойник «МеталлПром»</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div className="card stat-card"><div className="stat-value" style={{ color: '#2A7DE1' }}>{totalPoints}</div><div className="stat-label">Баллов</div></div>
              <div className="card stat-card"><div className="stat-value" style={{ color: '#22c55e' }}>{totalDone}/{TASKS.length}</div><div className="stat-label">Заданий</div></div>
              <div className="card stat-card"><div className="stat-value">{errors.length}</div><div className="stat-label">Ошибок</div></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              {TASKS.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', marginBottom: 6, borderRadius: 8, background: completedTasks[t.id] ? '#f0fdf4' : '#fef2f2' }}>
                  <span style={{ fontSize: 14 }}>{t.icon} {t.id === 'cost' ? 'Себестоимость' : t.id === 'shifts' ? 'Смены' : t.id === 'price' ? 'Цена' : t.id === 'invest' ? 'Инвестиции' : 'Антикризис'}</span>
                  <span style={{ fontWeight: 700, color: completedTasks[t.id] ? '#22c55e' : '#ef4444' }}>
                    {completedTasks[t.id] ? `✓ ${taskPoints[t.id]} б.` : `✗ ${taskPoints[t.id] || 0} б.`}
                  </span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary w-full" onClick={onFinish} style={{ fontSize: 15 }}>Вернуться к практикам</button>
          </div>
        </div>
      )}
    </div>
  );
}
