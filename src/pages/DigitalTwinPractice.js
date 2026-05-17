// src/pages/DigitalTwinPractice.js — v3 (no-scroll, fixed economics)
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

// ─── TASK DEFINITIONS ──────────────────────────────────────────────────────────
const TASKS = [
  { id:'cost',   icon:'📦', color:'#2A7DE1', title:'Задание 1: Снижение себестоимости',
    desc:'Снизьте себестоимость единицы продукции минимум на 8% за счёт управления закупками и ФОТ.',
    goal:'Снижение с/с ≥ 8%',
    hint:'Увеличьте объём закупки для скидки поставщика (900+ ед.), снизьте ФОТ или накладные.' },
  { id:'shifts', icon:'👷', color:'#f59e0b', title:'Задание 2: Оптимизация смен',
    desc:'Подберите число смен и ФОТ так, чтобы прибыль превысила 3 500 000 ₽ при объёме ≥ 900 ед.',
    goal:'Прибыль > 3 500 000 ₽ и объём ≥ 900 ед.',
    hint:'Попробуйте 2–3 смены и увеличьте объём производства выше 1 200 ед.' },
  { id:'price',  icon:'💰', color:'#22c55e', title:'Задание 3: Ценообразование',
    desc:'Найдите цену, при которой маржа превысит 30%, не снижая объём производства ниже 800 ед.',
    goal:'Маржа > 30% и объём ≥ 800 ед.',
    hint:'Поднимите цену продажи выше 11 000 ₽ при сохранении объёма.' },
  { id:'invest', icon:'🏭', color:'#a855f7', title:'Задание 4: Инвестиции',
    desc:'Закупаете оборудование за 2 000 000 ₽. Добейтесь дополнительной прибыли так, чтобы ROI ≥ 20%.',
    goal:'ROI ≥ 20% (доп.прибыль / 2 000 000)',
    hint:'Нарастите объём производства и снизьте себестоимость для максимальной доп. прибыли.' },
  { id:'crisis', icon:'⚠️', color:'#ef4444', title:'Задание 5: Антикризисный план',
    desc:'Кризис: закупка ≤ 600 ед. Сохраните прибыльность (прибыль > 0) и маржу ≥ 10%.',
    goal:'Прибыль > 0 и маржа ≥ 10% при закупке ≤ 600',
    hint:'Снижайте ФОТ, накладные и повышайте цену продажи.' },
];

// ─── BASE VALUES (per-unit rates + fixed costs) ────────────────────────────────
const BASE = {
  rawRate: 3500,        // сырьё ₽/ед
  laborRate: 2000,      // ФОТ ₽/ед
  overheadFixed: 1500000, // накладные (фикс)
  warehouseRate: 300,   // склад ₽/ед закупки
  productionVolume: 1000,
  purchaseVolume: 800,
  salePrice: 8500,
  shifts: 2,
};

const LABELS = {
  rawRate:        'Стоимость сырья (₽/ед)',
  laborRate:      'ФОТ на единицу (₽/ед)',
  overheadFixed:  'Накладные расходы (₽)',
  warehouseRate:  'Склад (₽/ед закупки)',
  productionVolume:'Объём производства (ед)',
  purchaseVolume: 'Объём закупки (ед)',
  salePrice:      'Цена продажи (₽/ед)',
};

const TIPS = {
  rawRate:        'Стоимость сырья на единицу продукции. При объёме закупки 900+ ед — скидка 4%, при 1000+ — 8%.',
  laborRate:      'ФОТ на единицу. При 1 смене −15%, при 3 сменах +15%.',
  overheadFixed:  'Постоянные расходы: аренда, амортизация, коммунальные.',
  warehouseRate:  'Расходы на хранение за каждую закупленную единицу.',
  productionVolume:'Объём выпуска. Больший объём — ниже постоянные затраты на единицу.',
  purchaseVolume: 'Объём закупки. 900+ → скидка 4%, 1000+ → скидка 8% от поставщика.',
  salePrice:      'Цена реализации единицы продукции.',
};

// ─── ECONOMICS ────────────────────────────────────────────────────────────────
function calc(p) {
  const volDiscount = p.purchaseVolume >= 1000 ? 0.92 : p.purchaseVolume >= 900 ? 0.96 : 1;
  const shiftMult   = p.shifts === 3 ? 1.15 : p.shifts === 1 ? 0.85 : 1;
  const rawEff      = p.rawRate * volDiscount;
  const laborEff    = p.laborRate * shiftMult;
  const warehouse   = p.warehouseRate * p.purchaseVolume;
  const totalCost   = (rawEff + laborEff) * p.productionVolume + p.overheadFixed + warehouse;
  const costPerUnit = totalCost / p.productionVolume;
  const revenue     = p.productionVolume * p.salePrice;
  const profit      = revenue - totalCost;
  const margin      = revenue > 0 ? (profit / revenue) * 100 : 0;
  return {
    rawEff: Math.round(rawEff), laborEff: Math.round(laborEff),
    warehouse: Math.round(warehouse), totalCost: Math.round(totalCost),
    costPerUnit: Math.round(costPerUnit), revenue: Math.round(revenue),
    profit: Math.round(profit), margin: Math.round(margin * 10) / 10,
  };
}

function checkGoal(id, p, m, bm) {
  const costRed = ((bm.costPerUnit - m.costPerUnit) / bm.costPerUnit) * 100;
  const roi     = ((m.profit - bm.profit) / 2000000) * 100;
  if (id === 'cost')   return costRed >= 8;
  if (id === 'shifts') return m.profit > 3500000 && p.productionVolume >= 900;
  if (id === 'price')  return m.margin > 30 && p.productionVolume >= 800;
  if (id === 'invest') return roi >= 20;
  if (id === 'crisis') return p.purchaseVolume <= 600 && m.profit > 0 && m.margin >= 10;
  return false;
}

function getProgress(id, p, m, bm) {
  const costRed = ((bm.costPerUnit - m.costPerUnit) / bm.costPerUnit) * 100;
  const roi     = ((m.profit - bm.profit) / 2000000) * 100;
  if (id === 'cost')   return { val: costRed,        target: 8,    unit: '%',  label: 'Снижение с/с' };
  if (id === 'shifts') return { val: m.profit/1000,  target: 3500, unit: 'K₽', label: 'Прибыль' };
  if (id === 'price')  return { val: m.margin,       target: 30,   unit: '%',  label: 'Маржа' };
  if (id === 'invest') return { val: roi,            target: 20,   unit: '%',  label: 'ROI' };
  if (id === 'crisis') return { val: m.margin,       target: 10,   unit: '%',  label: 'Маржа (кризис)' };
  return { val: 0, target: 100, unit: '', label: '' };
}

// ─── SLIDER ────────────────────────────────────────────────────────────────────
function Slider({ k, min, max, step, value, unit, onChange, warn, tip, showTips, isCrisisLock }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const [hover, setHover] = useState(false);
  const fmtVal = v => v >= 1000 ? v.toLocaleString('ru') : v;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{LABELS[k]}</span>
          {isCrisisLock && <span style={{ fontSize:10, color:'#ef4444', fontWeight:700 }}>🔒MAX {max}</span>}
          {showTips && (
            <span style={{ position:'relative' }} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
              <span style={{ width:14,height:14,borderRadius:'50%',background:'#6b7280',color:'#fff',fontSize:9,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'help' }}>?</span>
              {hover && <div style={{ position:'absolute',left:'110%',top:'50%',transform:'translateY(-50%)',background:'#1e293b',color:'#e2e8f0',fontSize:11,padding:'7px 10px',borderRadius:7,width:200,zIndex:200,boxShadow:'0 4px 16px rgba(0,0,0,0.4)',lineHeight:1.5,whiteSpace:'normal' }}>{tip}</div>}
            </span>
          )}
        </div>
        <span style={{ fontSize:13,fontWeight:800,color:warn?'#ef4444':'#2A7DE1',background:warn?'#fef2f2':'#eff6ff',padding:'1px 8px',borderRadius:5,minWidth:60,textAlign:'right' }}>
          {fmtVal(value)}{unit}
        </span>
      </div>
      <div style={{ position:'relative',height:20,display:'flex',alignItems:'center' }}>
        <div style={{ position:'absolute',left:0,right:0,height:5,borderRadius:3,background:'#e5e7eb' }}/>
        <div style={{ position:'absolute',left:0,width:`${pct}%`,height:5,borderRadius:3,background:warn?'linear-gradient(90deg,#f59e0b,#ef4444)':'linear-gradient(90deg,#2A7DE1,#60a5fa)',transition:'width .1s' }}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(k, Number(e.target.value))}
          style={{ position:'absolute',width:'100%',opacity:0,height:20,cursor:'pointer',zIndex:2 }}/>
        <div style={{ position:'absolute',left:`calc(${pct}% - 9px)`,width:18,height:18,borderRadius:'50%',background:warn?'#ef4444':'#2A7DE1',border:'2px solid #fff',boxShadow:'0 1px 4px rgba(0,0,0,0.3)',transition:'left .08s',pointerEvents:'none' }}/>
      </div>
      <div style={{ display:'flex',justifyContent:'space-between',marginTop:1 }}>
        <span style={{ fontSize:9,color:'#d1d5db' }}>{fmtVal(min)}{unit}</span>
        <span style={{ fontSize:9,color:'#d1d5db' }}>{fmtVal(max)}{unit}</span>
      </div>
    </div>
  );
}

// ─── KPI CARD ──────────────────────────────────────────────────────────────────
function KCard({ label, value, sub, subGood }) {
  return (
    <div style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:'10px 12px',display:'flex',flexDirection:'column',gap:2 }}>
      <div style={{ fontSize:10,fontWeight:600,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px' }}>{label}</div>
      <div style={{ fontSize:18,fontWeight:800,color:'#111',lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:11,fontWeight:600,color:subGood?'#22c55e':'#ef4444' }}>{sub}</div>}
    </div>
  );
}

// ─── PROGRESS RING ─────────────────────────────────────────────────────────────
function Ring({ pct, color, size=64 }) {
  const r = (size-8)/2, circ = 2*Math.PI*r, dash = (Math.min(pct,100)/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)',flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:'stroke-dasharray .4s' }}/>
    </svg>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DigitalTwinPractice({ practice, scene, onFinish }) {
  const { user } = useAuth();
  const isTraining = practice.mode === 'training';

  const [activeTask, setActiveTask]       = useState(0);
  const [completedTasks, setCompletedTasks] = useState({});  // {id: true/false}
  const [taskPoints, setTaskPoints]       = useState({});    // {id: pts}
  const [params, setParams]               = useState({ ...BASE });
  const [history, setHistory]             = useState([]);    // [{taskId, ...metrics}]
  const [taskErrors, setTaskErrors]       = useState({});    // {id: count}
  const [finished, setFinished]           = useState(false);
  const [startTime]                       = useState(Date.now());
  const [calculated, setCalculated]       = useState(false); // must click Рассчитать first

  const task     = TASKS[activeTask];
  const bm       = calc(BASE);
  const m        = calc(params);
  const achieved = checkGoal(task.id, params, m, bm);
  const prog     = getProgress(task.id, params, m, bm);
  const progPct  = Math.max(0, Math.min(100, (prog.val / prog.target) * 100));
  const isCrisis = task.id === 'crisis';
  const extraProfit = m.profit - bm.profit;
  const roi      = (extraProfit / 2000000) * 100;
  const totalDone  = Object.keys(completedTasks).length;
  const totalPts   = Object.values(taskPoints).reduce((a,b) => a+b, 0);

  const set = useCallback((k, v) => {
    setCalculated(false);
    setParams(p => ({ ...p, [k]: isCrisis && k==='purchaseVolume' ? Math.min(v,600) : v }));
  }, [isCrisis]);

  const handleCalc = () => {
    setCalculated(true);
    setHistory(h => [...h, { taskId:task.id, ...m, params:{...params} }]);
    if (!achieved) setTaskErrors(e => ({ ...e, [task.id]: (e[task.id]||0)+1 }));
  };

  const handleNext = () => {
    if (!calculated) return;
    const errs = taskErrors[task.id] || 0;
    const pts  = achieved ? Math.max(50, 100 - errs*8) : (isTraining ? 35 : 15);
    setCompletedTasks(c => ({ ...c, [task.id]: achieved }));
    setTaskPoints(p => ({ ...p, [task.id]: pts }));
    if (activeTask < TASKS.length - 1) {
      setActiveTask(i => i+1);
      setParams({ ...BASE });
      setCalculated(false);
    }
  };

  const handleFinish = () => {
    setFinished(true);
    const avg = Math.round(totalPts / Math.max(1, Object.keys(taskPoints).length));
    Storage.addResult({
      id:`result-${Date.now()}`, studentId:user.id, studentName:user.name,
      practiceId:practice.id, practiceTitle:practice.title,
      sceneType:'digital', mode:practice.mode,
      score:avg, errors:Object.values(taskErrors).reduce((a,b)=>a+b,0),
      completedTasks, taskPoints, duration:Math.round((Date.now()-startTime)/1000),
      date:new Date().toISOString(),
    });
  };

  // Bar chart data
  const chartData = [
    { name:'База',    cost:bm.costPerUnit, profit:Math.round(bm.profit/1000) },
    { name:'Сейчас', cost:m.costPerUnit,  profit:Math.round(m.profit/1000)  },
  ];
  const structData = [
    { name:'Сырьё',     v:m.rawEff*params.productionVolume,   c:'#ef4444' },
    { name:'Труд',      v:m.laborEff*params.productionVolume,  c:'#f59e0b' },
    { name:'Накладные', v:params.overheadFixed,                c:'#8b5cf6' },
    { name:'Склад',     v:m.warehouse,                         c:'#3b82f6' },
  ];

  // Task history for this task
  const taskHistory = history.filter(h => h.taskId === task.id).slice(-4);

  // ─── LAYOUT: full-height, no scroll ──────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#f1f5f9', fontFamily:'system-ui,sans-serif', overflow:'hidden' }}>

      {/* TOP BAR — fixed height */}
      <div style={{ background:'#fff', borderBottom:'2px solid #2A7DE1', padding:'8px 20px', display:'flex', alignItems:'center', gap:14, flexShrink:0, height:52 }}>
        <button style={{ padding:'5px 14px',background:'#f1f5f9',border:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer',fontWeight:600,fontSize:13 }} onClick={onFinish}>← Назад</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{practice.title}</div>
          <div style={{ color:'#6b7280', fontSize:11 }}>Цифровой двойник «МеталлПром»</div>
        </div>
        <div style={{ display:'flex', gap:20, alignItems:'center', flexShrink:0 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#2A7DE1', lineHeight:1 }}>{totalDone}/{TASKS.length}</div>
            <div style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase' }}>заданий</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#22c55e', lineHeight:1 }}>{totalPts}</div>
            <div style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase' }}>баллов</div>
          </div>
          <span style={{ background:isTraining?'#dcfce7':'#fef3c7', color:isTraining?'#166534':'#92400e', padding:'3px 10px', borderRadius:10, fontSize:12, fontWeight:600 }}>
            {isTraining ? '📚 Обучение' : '📝 Экзамен'}
          </span>
        </div>
      </div>

      {/* BODY — fills remaining height, no scroll */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* SIDEBAR */}
        <div style={{ width:200, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', flexShrink:0, padding:'12px 10px', gap:6, overflow:'hidden' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Задания</div>
          {TASKS.map((t, i) => {
            const done    = completedTasks[t.id] !== undefined;
            const success = completedTasks[t.id] === true;
            const active  = i === activeTask;
            const locked  = !done && i > activeTask;
            return (
              <div key={t.id}
                onClick={() => { if (!locked) { setActiveTask(i); setParams({...BASE}); setCalculated(false); }}}
                style={{ padding:'8px 10px', borderRadius:9, cursor:locked?'not-allowed':'pointer',
                  background:active?'#eff6ff':done?(success?'#f0fdf4':'#fef2f2'):'#f9fafb',
                  border:`1.5px solid ${active?'#2A7DE1':done?(success?'#22c55e':'#ef4444'):'#e5e7eb'}`,
                  opacity:locked?0.4:1, transition:'all .15s', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ fontSize:16 }}>{t.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:active?'#2A7DE1':'#374151', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {i+1}. {['Себест.','Смены','Цена','Инвест.','Кризис'][i]}
                    </div>
                    <div style={{ fontSize:10, color:done?(success?'#22c55e':'#ef4444'):active?'#2A7DE1':'#9ca3af', fontWeight:600 }}>
                      {done ? (success?`✓ ${taskPoints[t.id]}б`:`✗ ${taskPoints[t.id]}б`) : active ? '▶ Активно' : '○ Ожидает'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:'auto', padding:'10px', background:'#f8fafc', borderRadius:9, border:'1px solid #e5e7eb', flexShrink:0 }}>
            <div style={{ fontSize:10, color:'#6b7280' }}>Итого баллов</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#2A7DE1', lineHeight:1.1 }}>{totalPts}</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>из {TASKS.length*100}</div>
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

          {/* TASK HEADER STRIP */}
          <div style={{ background:'#fff', borderBottom:`2px solid ${task.color}`, padding:'10px 18px', display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
            <span style={{ fontSize:28 }}>{task.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:15 }}>{task.title}</div>
              <div style={{ fontSize:12, color:'#6b7280', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.desc}</div>
            </div>
            {/* Ring + label */}
            <div style={{ position:'relative', flexShrink:0, width:64, height:64 }}>
              <Ring pct={progPct} color={achieved?'#22c55e':task.color} size={64}/>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:achieved?'#22c55e':task.color, textAlign:'center', lineHeight:1.1 }}>
                {prog.val.toFixed?prog.val.toFixed(0):prog.val}{prog.unit}
              </div>
            </div>
            {/* Goal badge */}
            <div style={{ background:achieved?'#f0fdf4':'#eff6ff', border:`1.5px solid ${achieved?'#22c55e':task.color}`, borderRadius:9, padding:'6px 12px', fontSize:12, color:achieved?'#166534':'#1d4ed8', fontWeight:600, flexShrink:0, maxWidth:220 }}>
              {achieved ? '✅ ЦЕЛЬ ДОСТИГНУТА!' : `🎯 ${task.goal}`}
            </div>
          </div>

          {/* TWO-COLUMN BODY */}
          <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden', padding:'12px 14px', gap:14 }}>

            {/* LEFT: SLIDERS */}
            <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', gap:10, overflow:'hidden' }}>
              {/* Panel 1: Производство */}
              <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>⚙️ Производство</div>
                <Slider k="productionVolume" min={500} max={2000} step={50} value={params.productionVolume} unit=" ед"
                  onChange={set} tip={TIPS.productionVolume} showTips={isTraining}/>
                <Slider k="salePrice" min={6000} max={18000} step={250} value={params.salePrice} unit=" ₽"
                  onChange={set} tip={TIPS.salePrice} showTips={isTraining}/>
              </div>

              {/* Panel 2: Закупки */}
              <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>📦 Закупки</div>
                <Slider k="rawRate" min={1500} max={6000} step={100} value={params.rawRate} unit=" ₽"
                  onChange={set} tip={TIPS.rawRate} showTips={isTraining}/>
                <Slider k="purchaseVolume" min={isCrisis?200:400} max={isCrisis?600:1400} step={50}
                  value={isCrisis?Math.min(params.purchaseVolume,600):params.purchaseVolume} unit=" ед"
                  onChange={set} warn={isCrisis&&params.purchaseVolume>580} tip={TIPS.purchaseVolume}
                  showTips={isTraining} isCrisisLock={isCrisis}/>
                {params.purchaseVolume>=900 && !isCrisis && (
                  <div style={{ fontSize:10, color:'#22c55e', fontWeight:700, marginTop:-6, marginBottom:6 }}>✓ Скидка поставщика {params.purchaseVolume>=1000?'8%':'4%'} активна</div>
                )}
                <Slider k="warehouseRate" min={100} max={800} step={25} value={params.warehouseRate} unit=" ₽"
                  onChange={set} tip={TIPS.warehouseRate} showTips={isTraining}/>
              </div>

              {/* Panel 3: Персонал */}
              <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>👷 Персонал</div>
                <Slider k="laborRate" min={800} max={5000} step={100} value={params.laborRate} unit=" ₽"
                  onChange={set} tip={TIPS.laborRate} showTips={isTraining}/>
                <div style={{ fontSize:11, fontWeight:600, color:'#374151', marginBottom:5 }}>Смен в сутки</div>
                <div style={{ display:'flex', gap:6 }}>
                  {[1,2,3].map(n=>(
                    <button key={n} onClick={()=>set('shifts',n)} style={{ flex:1, padding:'7px 0', borderRadius:7, border:`1.5px solid ${params.shifts===n?'#2A7DE1':'#e5e7eb'}`, background:params.shifts===n?'#2A7DE1':'#f9fafb', color:params.shifts===n?'#fff':'#374151', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      {n}<br/><span style={{ fontSize:9, fontWeight:400 }}>{n===1?'−15%':n===2?'норма':'+15%'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel 4: Накладные */}
              <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>🏗 Накладные</div>
                <Slider k="overheadFixed" min={500000} max={4000000} step={100000} value={params.overheadFixed} unit=" ₽"
                  onChange={set} tip={TIPS.overheadFixed} showTips={isTraining}/>
              </div>

              {/* BUTTONS */}
              <button onClick={handleCalc} style={{ padding:'11px 0', borderRadius:9, background:'#2A7DE1', color:'#fff', border:'none', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 2px 8px rgba(42,125,225,0.35)' }}>
                🔄 Рассчитать
              </button>
              <button onClick={handleNext} disabled={!calculated}
                style={{ padding:'11px 0', borderRadius:9, background:achieved?'#22c55e':isTraining?'#f59e0b':'#9ca3af', color:'#fff', border:'none', fontWeight:700, fontSize:14, cursor:calculated?'pointer':'not-allowed', opacity:calculated?1:0.5 }}>
                {achieved ? '✅ Завершить задание' : isTraining ? '📚 Следующее задание' : `Цель: ${task.goal}`}
              </button>

              {/* Tip */}
              {isTraining && calculated && !achieved && (
                <div style={{ background:'#fffbeb', border:'1px solid #fbbf24', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#92400e' }}>
                  💡 {task.hint}
                </div>
              )}
              {isCrisis && (
                <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#b91c1c' }}>
                  ⚠️ Кризис: закупка ограничена ≤ 600 ед.
                </div>
              )}
            </div>

            {/* RIGHT: METRICS */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minWidth:0, overflow:'hidden' }}>

              {/* KPI row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, flexShrink:0 }}>
                <KCard label="Себест./ед" value={`${m.costPerUnit.toLocaleString('ru')} ₽`}
                  sub={`${((bm.costPerUnit-m.costPerUnit)/bm.costPerUnit*100).toFixed(1)}% к базе`}
                  subGood={m.costPerUnit < bm.costPerUnit}/>
                <KCard label="Прибыль" value={`${(m.profit/1000).toFixed(0)}K ₽`}
                  sub={`${extraProfit>=0?'+':''}${(extraProfit/1000).toFixed(0)}K к базе`}
                  subGood={extraProfit>=0}/>
                <KCard label="Маржа" value={`${m.margin}%`}
                  sub={`${(m.margin-bm.margin).toFixed(1)}% к базе`}
                  subGood={m.margin>=bm.margin}/>
                <KCard label="Выручка" value={`${(m.revenue/1000).toFixed(0)}K ₽`}
                  sub={`${((m.revenue-bm.revenue)/bm.revenue*100).toFixed(1)}% к базе`}
                  subGood={m.revenue>=bm.revenue}/>
              </div>

              {/* Progress bar */}
              <div style={{ background:'#fff', borderRadius:10, padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{prog.label}</span>
                  <span style={{ fontWeight:800, color:achieved?'#22c55e':task.color, fontSize:14 }}>
                    {prog.val.toFixed?prog.val.toFixed(1):prog.val}{prog.unit} / {prog.target}{prog.unit}
                  </span>
                </div>
                <div style={{ background:'#e5e7eb', borderRadius:99, height:8, overflow:'hidden' }}>
                  <div style={{ width:`${progPct}%`, height:'100%', background:achieved?'#22c55e':`linear-gradient(90deg,${task.color},#60a5fa)`, borderRadius:99, transition:'width .5s' }}/>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flex:1, minHeight:0 }}>
                {/* Bar chart */}
                <div style={{ background:'#fff', borderRadius:10, padding:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column' }}>
                  <div style={{ fontWeight:700, fontSize:12, marginBottom:6, color:'#374151' }}>📊 База vs Текущее</div>
                  <div style={{ flex:1, minHeight:0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                        <XAxis dataKey="name" tick={{ fontSize:10 }}/>
                        <YAxis tick={{ fontSize:9 }}/>
                        <Tooltip formatter={(v,n)=>[v.toLocaleString('ru'), n==='cost'?'Себест. ₽':'Прибыль тыс.₽']}/>
                        <Bar dataKey="cost"   fill="#ef4444" name="Себестоимость" radius={[3,3,0,0]}/>
                        <Bar dataKey="profit" fill="#22c55e" name="Прибыль"       radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Structure */}
                <div style={{ background:'#fff', borderRadius:10, padding:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div style={{ fontWeight:700, fontSize:12, marginBottom:8, color:'#374151' }}>🥧 Структура затрат</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:7, flex:1, justifyContent:'center' }}>
                    {structData.map((d,i)=>{
                      const p2 = m.totalCost>0 ? (d.v/m.totalCost*100) : 0;
                      return (
                        <div key={i}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}>
                            <span style={{ color:'#374151' }}>{d.name}</span>
                            <span style={{ fontWeight:700, color:d.c }}>{p2.toFixed(0)}%</span>
                          </div>
                          <div style={{ background:'#f3f4f6', borderRadius:4, height:5 }}>
                            <div style={{ width:`${p2}%`, height:'100%', background:d.c, borderRadius:4, transition:'width .4s' }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:10, color:'#9ca3af', marginTop:6 }}>Итого: {m.totalCost.toLocaleString('ru')} ₽</div>
                </div>
              </div>

              {/* ROI panel / History */}
              <div style={{ display:'grid', gridTemplateColumns: task.id==='invest' ? '1fr 1fr' : '1fr', gap:10, flexShrink:0 }}>
                {task.id==='invest' && (
                  <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', border:'1px solid #a855f7', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>🏭 Инвестиционный анализ</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                      <KCard label="Доп.прибыль" value={`${(extraProfit/1000).toFixed(0)}K ₽`}/>
                      <KCard label="ROI" value={`${roi.toFixed(1)}%`}/>
                      <KCard label="Окупаемость" value={extraProfit>0?`${(2000000/extraProfit).toFixed(1)}л`:'∞'}/>
                    </div>
                  </div>
                )}
                {/* History */}
                {taskHistory.length > 0 && (
                  <div style={{ background:'#fff', borderRadius:10, padding:'10px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflowX:'auto' }}>
                    <div style={{ fontWeight:700, fontSize:12, marginBottom:6, color:'#374151' }}>📈 Последние расчёты</div>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                      <thead>
                        <tr style={{ borderBottom:'1.5px solid #e5e7eb' }}>
                          <th style={{ padding:'3px 8px', textAlign:'left', color:'#9ca3af', fontWeight:600 }}>#</th>
                          <th style={{ padding:'3px 8px', textAlign:'right', color:'#9ca3af', fontWeight:600 }}>С/с</th>
                          <th style={{ padding:'3px 8px', textAlign:'right', color:'#9ca3af', fontWeight:600 }}>Прибыль</th>
                          <th style={{ padding:'3px 8px', textAlign:'right', color:'#9ca3af', fontWeight:600 }}>Маржа</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskHistory.map((h,i)=>(
                          <tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}>
                            <td style={{ padding:'3px 8px', color:'#6b7280' }}>{history.filter(x=>x.taskId===task.id).indexOf(h)+1}</td>
                            <td style={{ padding:'3px 8px', textAlign:'right' }}>{h.costPerUnit?.toLocaleString('ru')}</td>
                            <td style={{ padding:'3px 8px', textAlign:'right' }}>{(h.profit/1000)?.toFixed(0)}K</td>
                            <td style={{ padding:'3px 8px', textAlign:'right', fontWeight:700, color:h.margin>bm.margin?'#22c55e':'#ef4444' }}>{h.margin}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Finish button */}
              {totalDone===TASKS.length && !finished && (
                <button onClick={handleFinish} style={{ padding:'12px 0', background:'#22c55e', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(34,197,94,0.4)', flexShrink:0 }}>
                  🏆 Завершить практику и сохранить результат
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FINISH MODAL */}
      {finished && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:520 }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:52 }}>🏆</div>
              <h2 className="modal-title" style={{ margin:'6px 0 2px' }}>Практика завершена!</h2>
              <p style={{ color:'#6b7280', margin:0, fontSize:13 }}>Цифровой двойник «МеталлПром»</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              <div className="card stat-card"><div className="stat-value" style={{ color:'#2A7DE1' }}>{totalPts}</div><div className="stat-label">Баллов</div></div>
              <div className="card stat-card"><div className="stat-value" style={{ color:'#22c55e' }}>{totalDone}/{TASKS.length}</div><div className="stat-label">Заданий</div></div>
              <div className="card stat-card"><div className="stat-value">{Object.values(taskErrors).reduce((a,b)=>a+b,0)}</div><div className="stat-label">Ошибок</div></div>
            </div>
            <div style={{ marginBottom:14 }}>
              {TASKS.map(t=>(
                <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', marginBottom:5, borderRadius:8, background:completedTasks[t.id]?'#f0fdf4':'#fef2f2' }}>
                  <span style={{ fontSize:13 }}>{t.icon} {['Себестоимость','Смены','Цена','Инвестиции','Антикризис'][TASKS.indexOf(t)]}</span>
                  <span style={{ fontWeight:700, color:completedTasks[t.id]?'#22c55e':'#ef4444' }}>
                    {completedTasks[t.id]?`✓ ${taskPoints[t.id]}б`:`✗ ${taskPoints[t.id]||0}б`}
                  </span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary w-full" onClick={onFinish}>Вернуться к практикам</button>
          </div>
        </div>
      )}
    </div>
  );
}
