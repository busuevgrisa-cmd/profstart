// src/pages/DigitalTwinPractice.js — v4 (fixed layout, no overflow)
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const TASKS = [
  { id:'cost',   icon:'📦', color:'#2A7DE1', title:'Задание 1: Снижение себестоимости',
    desc:'Снизьте себестоимость единицы продукции минимум на 8%.',
    goal:'Снижение с/с ≥ 8%',
    hint:'Увеличьте объём закупки до 900+ ед. (скидка поставщика), снизьте ФОТ.' },
  { id:'shifts', icon:'👷', color:'#f59e0b', title:'Задание 2: Оптимизация смен',
    desc:'Прибыль > 3 500 000 ₽ при объёме производства ≥ 900 ед.',
    goal:'Прибыль > 3 500 000 ₽ и объём ≥ 900 ед.',
    hint:'Попробуйте 2–3 смены, увеличьте объём производства выше 1 200 ед.' },
  { id:'price',  icon:'💰', color:'#22c55e', title:'Задание 3: Ценообразование',
    desc:'Маржа > 30% без снижения объёма ниже 800 ед.',
    goal:'Маржа > 30% и объём ≥ 800 ед.',
    hint:'Поднимите цену продажи выше 11 000 ₽ при сохранении объёма.' },
  { id:'invest', icon:'🏭', color:'#a855f7', title:'Задание 4: Инвестиции',
    desc:'Закупка оборудования 2 000 000 ₽. Добейтесь ROI ≥ 20%.',
    goal:'ROI ≥ 20% (доп.прибыль / 2 000 000)',
    hint:'Наращивайте объём и снижайте себестоимость для максимальной доп. прибыли.' },
  { id:'crisis', icon:'⚠️', color:'#ef4444', title:'Задание 5: Антикризис',
    desc:'Кризис: закупка ≤ 600 ед. Прибыль > 0 и маржа ≥ 10%.',
    goal:'Прибыль > 0 и маржа ≥ 10% при закупке ≤ 600',
    hint:'Снижайте ФОТ и накладные, повышайте цену продажи.' },
];

const BASE = {
  rawRate:3500, laborRate:2000, overheadFixed:1500000,
  warehouseRate:300, productionVolume:1000, purchaseVolume:800, salePrice:8500, shifts:2,
};

const LABELS = {
  rawRate:'Сырьё (₽/ед)', laborRate:'ФОТ (₽/ед)', overheadFixed:'Накладные (₽)',
  warehouseRate:'Склад (₽/ед)', productionVolume:'Объём пр-ва (ед)', purchaseVolume:'Объём закупки (ед)', salePrice:'Цена продажи (₽)',
};
const TIPS = {
  rawRate:'Стоимость сырья на единицу. Скидка 4% при 900+ ед. закупки, 8% при 1000+.',
  laborRate:'ФОТ на единицу. 1 смена −15%, 3 смены +15%.',
  overheadFixed:'Постоянные расходы: аренда, амортизация, коммунальные.',
  warehouseRate:'Расходы на хранение за каждую закупленную единицу.',
  productionVolume:'Объём выпуска в единицах.',
  purchaseVolume:'Объём закупки. 900+ → скидка 4%, 1000+ → скидка 8%.',
  salePrice:'Цена реализации единицы продукции.',
};

function calc(p) {
  const vd  = p.purchaseVolume>=1000?0.92:p.purchaseVolume>=900?0.96:1;
  const sm  = p.shifts===3?1.15:p.shifts===1?0.85:1;
  const raw = p.rawRate*vd, lab=p.laborRate*sm, wh=p.warehouseRate*p.purchaseVolume;
  const tc  = (raw+lab)*p.productionVolume+p.overheadFixed+wh;
  const cpu = tc/p.productionVolume, rev=p.productionVolume*p.salePrice;
  const prf = rev-tc, mgn=rev>0?(prf/rev)*100:0;
  return { raw:Math.round(raw), lab:Math.round(lab), wh:Math.round(wh),
    totalCost:Math.round(tc), costPerUnit:Math.round(cpu),
    revenue:Math.round(rev), profit:Math.round(prf), margin:Math.round(mgn*10)/10 };
}
function checkGoal(id,p,m,bm){
  const cr=((bm.costPerUnit-m.costPerUnit)/bm.costPerUnit)*100;
  const roi=((m.profit-bm.profit)/2000000)*100;
  if(id==='cost')   return cr>=8;
  if(id==='shifts') return m.profit>3500000&&p.productionVolume>=900;
  if(id==='price')  return m.margin>30&&p.productionVolume>=800;
  if(id==='invest') return roi>=20;
  if(id==='crisis') return p.purchaseVolume<=600&&m.profit>0&&m.margin>=10;
  return false;
}
function getProg(id,p,m,bm){
  const cr=((bm.costPerUnit-m.costPerUnit)/bm.costPerUnit)*100;
  const roi=((m.profit-bm.profit)/2000000)*100;
  if(id==='cost')   return {val:cr,       target:8,    unit:'%', label:'Снижение с/с'};
  if(id==='shifts') return {val:m.profit/1000,target:3500,unit:'K₽',label:'Прибыль'};
  if(id==='price')  return {val:m.margin, target:30,   unit:'%', label:'Маржа'};
  if(id==='invest') return {val:roi,      target:20,   unit:'%', label:'ROI'};
  if(id==='crisis') return {val:m.margin, target:10,   unit:'%', label:'Маржа'};
  return {val:0,target:100,unit:'',label:''};
}

// ── Slider ──────────────────────────────────────────────────────────────────
function Slider({k,min,max,step,value,unit,onChange,warn,tip,showTips,crisisMax}){
  const pct=Math.max(0,Math.min(100,((value-min)/(max-min))*100));
  const [hov,setHov]=useState(false);
  const fmt=v=>v>=1000?v.toLocaleString('ru'):v;
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{fontSize:11,fontWeight:600,color:'#374151'}}>{LABELS[k]}</span>
          {crisisMax&&<span style={{fontSize:9,color:'#ef4444',fontWeight:700}}>🔒≤{max}</span>}
          {showTips&&<span style={{position:'relative'}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
            <span style={{width:13,height:13,borderRadius:'50%',background:'#94a3b8',color:'#fff',fontSize:8,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'help'}}>?</span>
            {hov&&<div style={{position:'absolute',left:'110%',top:'50%',transform:'translateY(-50%)',background:'#1e293b',color:'#e2e8f0',fontSize:10,padding:'6px 9px',borderRadius:6,width:180,zIndex:300,boxShadow:'0 4px 16px rgba(0,0,0,0.45)',lineHeight:1.4,whiteSpace:'normal'}}>{tip}</div>}
          </span>}
        </div>
        <span style={{fontSize:12,fontWeight:800,color:warn?'#ef4444':'#2A7DE1',background:warn?'#fef2f2':'#eff6ff',padding:'1px 7px',borderRadius:4,minWidth:52,textAlign:'right'}}>
          {fmt(value)}{unit}
        </span>
      </div>
      <div style={{position:'relative',height:18,display:'flex',alignItems:'center'}}>
        <div style={{position:'absolute',left:0,right:0,height:4,borderRadius:2,background:'#e5e7eb'}}/>
        <div style={{position:'absolute',left:0,width:`${pct}%`,height:4,borderRadius:2,background:warn?'linear-gradient(90deg,#f59e0b,#ef4444)':'linear-gradient(90deg,#2A7DE1,#60a5fa)',transition:'width .1s'}}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(k,Number(e.target.value))}
          style={{position:'absolute',width:'100%',opacity:0,height:18,cursor:'pointer',zIndex:2}}/>
        <div style={{position:'absolute',left:`calc(${pct}% - 8px)`,width:16,height:16,borderRadius:'50%',background:warn?'#ef4444':'#2A7DE1',border:'2px solid #fff',boxShadow:'0 1px 4px rgba(0,0,0,0.25)',transition:'left .08s',pointerEvents:'none'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:1}}>
        <span style={{fontSize:8,color:'#d1d5db'}}>{fmt(min)}{unit}</span>
        <span style={{fontSize:8,color:'#d1d5db'}}>{fmt(max)}{unit}</span>
      </div>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KCard({label,value,sub,subGood}){
  return(
    <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:'8px 10px'}}>
      <div style={{fontSize:9,fontWeight:600,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
      <div style={{fontSize:16,fontWeight:800,color:'#111',lineHeight:1.15}}>{value}</div>
      {sub&&<div style={{fontSize:10,fontWeight:600,color:subGood?'#22c55e':'#ef4444'}}>{sub}</div>}
    </div>
  );
}

// ── Ring ────────────────────────────────────────────────────────────────────
function Ring({pct,color,size=56}){
  const r=(size-7)/2,circ=2*Math.PI*r,dash=(Math.min(pct,100)/100)*circ;
  return(
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray .4s'}}/>
    </svg>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DigitalTwinPractice({practice,scene,onFinish}){
  const {user}=useAuth();
  const isTraining=practice.mode==='training';
  const [activeTask,setActiveTask]=useState(0);
  const [completedTasks,setCompletedTasks]=useState({});
  const [taskPoints,setTaskPoints]=useState({});
  const [params,setParams]=useState({...BASE});
  const [history,setHistory]=useState([]);
  const [taskErrors,setTaskErrors]=useState({});
  const [finished,setFinished]=useState(false);
  const [startTime]=useState(Date.now());
  const [calculated,setCalculated]=useState(false);

  const task=TASKS[activeTask];
  const bm=calc(BASE), m=calc(params);
  const achieved=checkGoal(task.id,params,m,bm);
  const prog=getProg(task.id,params,m,bm);
  const progPct=Math.max(0,Math.min(100,(prog.val/prog.target)*100));
  const isCrisis=task.id==='crisis';
  const extraProfit=m.profit-bm.profit;
  const roi=(extraProfit/2000000)*100;
  const totalDone=Object.keys(completedTasks).length;
  const totalPts=Object.values(taskPoints).reduce((a,b)=>a+b,0);

  const set=useCallback((k,v)=>{
    setCalculated(false);
    setParams(p=>({...p,[k]:isCrisis&&k==='purchaseVolume'?Math.min(v,600):v}));
  },[isCrisis]);

  const handleCalc=()=>{
    setCalculated(true);
    setHistory(h=>[...h,{taskId:task.id,...m}]);
    if(!achieved) setTaskErrors(e=>({...e,[task.id]:(e[task.id]||0)+1}));
  };

  const handleNext=()=>{
    if(!calculated) return;
    const errs=taskErrors[task.id]||0;
    const pts=achieved?Math.max(50,100-errs*8):(isTraining?35:15);
    setCompletedTasks(c=>({...c,[task.id]:achieved}));
    setTaskPoints(p=>({...p,[task.id]:pts}));
    if(activeTask<TASKS.length-1){
      setActiveTask(i=>i+1); setParams({...BASE}); setCalculated(false);
    }
  };

  const handleFinish=()=>{
    setFinished(true);
    const avg=Math.round(totalPts/Math.max(1,Object.keys(taskPoints).length));
    Storage.addResult({id:`result-${Date.now()}`,studentId:user.id,studentName:user.name,
      practiceId:practice.id,practiceTitle:practice.title,sceneType:'digital',mode:practice.mode,
      score:avg,errors:Object.values(taskErrors).reduce((a,b)=>a+b,0),
      completedTasks,taskPoints,duration:Math.round((Date.now()-startTime)/1000),date:new Date().toISOString()});
  };

  const taskHistory=history.filter(h=>h.taskId===task.id).slice(-4);
  const chartData=[
    {name:'База', cost:bm.costPerUnit, profit:Math.round(bm.profit/1000)},
    {name:'Сейчас',cost:m.costPerUnit,  profit:Math.round(m.profit/1000)},
  ];
  const structData=[
    {name:'Сырьё',    v:m.raw*params.productionVolume,  c:'#ef4444'},
    {name:'Труд',     v:m.lab*params.productionVolume,   c:'#f59e0b'},
    {name:'Накладные',v:params.overheadFixed,             c:'#8b5cf6'},
    {name:'Склад',    v:m.wh,                             c:'#3b82f6'},
  ];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return(
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'#f1f5f9',fontFamily:'system-ui,sans-serif',overflow:'hidden'}}>

      {/* TOP BAR */}
      <div style={{background:'#fff',borderBottom:'2px solid #2A7DE1',padding:'0 20px',display:'flex',alignItems:'center',gap:14,flexShrink:0,height:48}}>
        <button style={{padding:'4px 12px',background:'#f1f5f9',border:'1px solid #e5e7eb',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:12}} onClick={onFinish}>← Назад</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{practice.title}</div>
          <div style={{color:'#6b7280',fontSize:10}}>Цифровой двойник «МеталлПром»</div>
        </div>
        <div style={{display:'flex',gap:16,alignItems:'center',flexShrink:0}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#2A7DE1',lineHeight:1}}>{totalDone}/{TASKS.length}</div>
            <div style={{fontSize:8,color:'#9ca3af',textTransform:'uppercase'}}>заданий</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#22c55e',lineHeight:1}}>{totalPts}</div>
            <div style={{fontSize:8,color:'#9ca3af',textTransform:'uppercase'}}>баллов</div>
          </div>
          <span style={{background:isTraining?'#dcfce7':'#fef3c7',color:isTraining?'#166534':'#92400e',padding:'3px 9px',borderRadius:9,fontSize:11,fontWeight:600}}>
            {isTraining?'📚 Обучение':'📝 Экзамен'}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>

        {/* SIDEBAR */}
        <div style={{width:188,background:'#fff',borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',flexShrink:0,padding:'10px 8px',gap:5,overflow:'hidden'}}>
          <div style={{fontSize:9,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>Задания</div>
          {TASKS.map((t,i)=>{
            const done=completedTasks[t.id]!==undefined, success=completedTasks[t.id]===true;
            const active=i===activeTask, locked=!done&&i>activeTask;
            return(
              <div key={t.id} onClick={()=>{if(!locked){setActiveTask(i);setParams({...BASE});setCalculated(false);}}}
                style={{padding:'7px 8px',borderRadius:8,cursor:locked?'not-allowed':'pointer',
                  background:active?'#eff6ff':done?(success?'#f0fdf4':'#fef2f2'):'#f9fafb',
                  border:`1.5px solid ${active?'#2A7DE1':done?(success?'#22c55e':'#ef4444'):'#e5e7eb'}`,
                  opacity:locked?0.38:1,transition:'all .15s',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:14}}>{t.icon}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:active?'#2A7DE1':'#374151',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {i+1}. {['Себест.','Смены','Цена','Инвест.','Кризис'][i]}
                    </div>
                    <div style={{fontSize:9,color:done?(success?'#22c55e':'#ef4444'):active?'#2A7DE1':'#9ca3af',fontWeight:600}}>
                      {done?(success?`✓ ${taskPoints[t.id]}б`:`✗ ${taskPoints[t.id]}б`):active?'▶ Активно':'○ Ожидает'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{marginTop:'auto',padding:'8px',background:'#f8fafc',borderRadius:8,border:'1px solid #e5e7eb',flexShrink:0}}>
            <div style={{fontSize:9,color:'#6b7280'}}>Итого баллов</div>
            <div style={{fontSize:22,fontWeight:800,color:'#2A7DE1',lineHeight:1.1}}>{totalPts}</div>
            <div style={{fontSize:9,color:'#9ca3af'}}>из {TASKS.length*100}</div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>

          {/* TASK HEADER */}
          <div style={{background:'#fff',borderBottom:`2px solid ${task.color}`,padding:'8px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
            <span style={{fontSize:24,flexShrink:0}}>{task.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:14}}>{task.title}</div>
              <div style={{fontSize:11,color:'#6b7280',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{task.desc}</div>
            </div>
            <div style={{position:'relative',flexShrink:0,width:56,height:56}}>
              <Ring pct={progPct} color={achieved?'#22c55e':task.color} size={56}/>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:achieved?'#22c55e':task.color,textAlign:'center',lineHeight:1.1}}>
                {typeof prog.val==='number'?prog.val.toFixed(0):prog.val}{prog.unit}
              </div>
            </div>
            <div style={{background:achieved?'#f0fdf4':'#eff6ff',border:`1.5px solid ${achieved?'#22c55e':task.color}`,borderRadius:8,padding:'5px 10px',fontSize:11,color:achieved?'#166534':'#1d4ed8',fontWeight:600,flexShrink:0,maxWidth:200}}>
              {achieved?'✅ ЦЕЛЬ ДОСТИГНУТА!':'🎯 '+task.goal}
            </div>
          </div>

          {/* MAIN TWO-COL */}
          <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden',padding:'10px 12px',gap:12}}>

            {/* LEFT — sliders scroll internally; buttons pinned to bottom */}
            <div style={{width:272,flexShrink:0,display:'flex',flexDirection:'column',minHeight:0}}>
              {/* Scrollable sliders area */}
              <div style={{flex:1,overflowY:'auto',overflowX:'hidden',display:'flex',flexDirection:'column',gap:8,paddingRight:4,paddingBottom:4}}>

                <div style={{background:'#fff',borderRadius:9,padding:'10px 12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>⚙️ Производство</div>
                  <Slider k="productionVolume" min={500} max={2000} step={50} value={params.productionVolume} unit=" ед" onChange={set} tip={TIPS.productionVolume} showTips={isTraining}/>
                  <Slider k="salePrice" min={6000} max={18000} step={250} value={params.salePrice} unit=" ₽" onChange={set} tip={TIPS.salePrice} showTips={isTraining}/>
                </div>

                <div style={{background:'#fff',borderRadius:9,padding:'10px 12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>📦 Закупки</div>
                  <Slider k="rawRate" min={1500} max={6000} step={100} value={params.rawRate} unit=" ₽" onChange={set} tip={TIPS.rawRate} showTips={isTraining}/>
                  <Slider k="purchaseVolume" min={isCrisis?200:400} max={isCrisis?600:1400} step={50}
                    value={isCrisis?Math.min(params.purchaseVolume,600):params.purchaseVolume} unit=" ед"
                    onChange={set} warn={isCrisis&&params.purchaseVolume>580}
                    tip={TIPS.purchaseVolume} showTips={isTraining} crisisMax={isCrisis}/>
                  {params.purchaseVolume>=900&&!isCrisis&&(
                    <div style={{fontSize:9,color:'#22c55e',fontWeight:700,marginTop:-4,marginBottom:6}}>✓ Скидка {params.purchaseVolume>=1000?'8%':'4%'} активна</div>
                  )}
                  <Slider k="warehouseRate" min={100} max={800} step={25} value={params.warehouseRate} unit=" ₽" onChange={set} tip={TIPS.warehouseRate} showTips={isTraining}/>
                </div>

                <div style={{background:'#fff',borderRadius:9,padding:'10px 12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>👷 Персонал</div>
                  <Slider k="laborRate" min={800} max={5000} step={100} value={params.laborRate} unit=" ₽" onChange={set} tip={TIPS.laborRate} showTips={isTraining}/>
                  <div style={{fontSize:10,fontWeight:600,color:'#374151',marginBottom:5}}>Смен в сутки</div>
                  <div style={{display:'flex',gap:5}}>
                    {[1,2,3].map(n=>(
                      <button key={n} onClick={()=>set('shifts',n)} style={{flex:1,padding:'6px 0',borderRadius:6,border:`1.5px solid ${params.shifts===n?'#2A7DE1':'#e5e7eb'}`,background:params.shifts===n?'#2A7DE1':'#f9fafb',color:params.shifts===n?'#fff':'#374151',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                        {n}<br/><span style={{fontSize:8,fontWeight:400}}>{n===1?'−15%':n===2?'норма':'+15%'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{background:'#fff',borderRadius:9,padding:'10px 12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>🏗 Накладные</div>
                  <Slider k="overheadFixed" min={500000} max={4000000} step={100000} value={params.overheadFixed} unit=" ₽" onChange={set} tip={TIPS.overheadFixed} showTips={isTraining}/>
                </div>

                {isCrisis&&<div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,padding:'7px 10px',fontSize:10,color:'#b91c1c'}}>⚠️ Кризис: закупка ограничена ≤ 600 ед.</div>}
                {isTraining&&calculated&&!achieved&&<div style={{background:'#fffbeb',border:'1px solid #fbbf24',borderRadius:8,padding:'7px 10px',fontSize:10,color:'#92400e'}}>💡 {task.hint}</div>}
              </div>

              {/* BUTTONS — always visible at bottom */}
              <div style={{flexShrink:0,paddingTop:8,display:'flex',flexDirection:'column',gap:6}}>
                <button onClick={handleCalc} style={{padding:'10px 0',borderRadius:8,background:'#2A7DE1',color:'#fff',border:'none',fontWeight:700,fontSize:13,cursor:'pointer',boxShadow:'0 2px 8px rgba(42,125,225,0.35)'}}>
                  🔄 Рассчитать
                </button>
                <button onClick={handleNext} disabled={!calculated}
                  style={{padding:'10px 0',borderRadius:8,background:achieved?'#22c55e':isTraining?'#f59e0b':'#9ca3af',color:'#fff',border:'none',fontWeight:700,fontSize:13,cursor:calculated?'pointer':'not-allowed',opacity:calculated?1:0.45}}>
                  {achieved?'✅ Завершить задание':isTraining?'📚 Следующее задание':`Нужно: ${task.goal}`}
                </button>
                {totalDone===TASKS.length&&!finished&&(
                  <button onClick={handleFinish} style={{padding:'10px 0',borderRadius:8,background:'#22c55e',color:'#fff',border:'none',fontWeight:800,fontSize:13,cursor:'pointer',boxShadow:'0 2px 10px rgba(34,197,94,0.4)'}}>
                    🏆 Завершить практику
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT — metrics, charts */}
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,minWidth:0,overflow:'hidden'}}>

              {/* KPI row */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,flexShrink:0}}>
                <KCard label="Себест./ед" value={`${m.costPerUnit.toLocaleString('ru')} ₽`}
                  sub={`${((bm.costPerUnit-m.costPerUnit)/bm.costPerUnit*100).toFixed(1)}% к базе`} subGood={m.costPerUnit<bm.costPerUnit}/>
                <KCard label="Прибыль" value={`${(m.profit/1000).toFixed(0)}K ₽`}
                  sub={`${extraProfit>=0?'+':''}${(extraProfit/1000).toFixed(0)}K к базе`} subGood={extraProfit>=0}/>
                <KCard label="Маржа" value={`${m.margin}%`}
                  sub={`${(m.margin-bm.margin).toFixed(1)}% к базе`} subGood={m.margin>=bm.margin}/>
                <KCard label="Выручка" value={`${(m.revenue/1000).toFixed(0)}K ₽`}
                  sub={`${((m.revenue-bm.revenue)/bm.revenue*100).toFixed(1)}% к базе`} subGood={m.revenue>=bm.revenue}/>
              </div>

              {/* Progress */}
              <div style={{background:'#fff',borderRadius:9,padding:'10px 14px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',flexShrink:0}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <span style={{fontWeight:700,fontSize:12}}>{prog.label}</span>
                  <span style={{fontWeight:800,color:achieved?'#22c55e':task.color,fontSize:13}}>
                    {typeof prog.val==='number'?prog.val.toFixed(1):prog.val}{prog.unit} / {prog.target}{prog.unit}
                  </span>
                </div>
                <div style={{background:'#e5e7eb',borderRadius:99,height:7,overflow:'hidden'}}>
                  <div style={{width:`${progPct}%`,height:'100%',background:achieved?'#22c55e':`linear-gradient(90deg,${task.color},#60a5fa)`,borderRadius:99,transition:'width .5s'}}/>
                </div>
              </div>

              {/* Charts row — flex:1 fills remaining space */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,flex:1,minHeight:0}}>
                <div style={{background:'#fff',borderRadius:9,padding:'10px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',display:'flex',flexDirection:'column'}}>
                  <div style={{fontWeight:700,fontSize:11,marginBottom:5,color:'#374151'}}>📊 База vs Текущее</div>
                  <div style={{flex:1,minHeight:0}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{top:4,right:4,left:-22,bottom:0}}>
                        <XAxis dataKey="name" tick={{fontSize:9}}/>
                        <YAxis tick={{fontSize:8}}/>
                        <Tooltip formatter={(v,n)=>[v.toLocaleString('ru'),n==='cost'?'Себест. ₽':'Прибыль тыс.₽']}/>
                        <Bar dataKey="cost"   fill="#ef4444" name="Себестоимость" radius={[3,3,0,0]}/>
                        <Bar dataKey="profit" fill="#22c55e" name="Прибыль"       radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{background:'#fff',borderRadius:9,padding:'10px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',display:'flex',flexDirection:'column'}}>
                  <div style={{fontWeight:700,fontSize:11,marginBottom:8,color:'#374151'}}>🥧 Структура затрат</div>
                  <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:6}}>
                    {structData.map((d,i)=>{
                      const p2=m.totalCost>0?(d.v/m.totalCost*100):0;
                      return(
                        <div key={i}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
                            <span style={{color:'#374151'}}>{d.name}</span>
                            <span style={{fontWeight:700,color:d.c}}>{p2.toFixed(0)}%</span>
                          </div>
                          <div style={{background:'#f3f4f6',borderRadius:3,height:4}}>
                            <div style={{width:`${p2}%`,height:'100%',background:d.c,borderRadius:3,transition:'width .4s'}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{fontSize:9,color:'#9ca3af',marginTop:6}}>Итого: {m.totalCost.toLocaleString('ru')} ₽</div>
                </div>
              </div>

              {/* Bottom row: ROI (invest) + history */}
              <div style={{display:'grid',gridTemplateColumns:task.id==='invest'?'1fr 1fr':'1fr',gap:8,flexShrink:0}}>
                {task.id==='invest'&&(
                  <div style={{background:'#fff',borderRadius:9,padding:'10px 12px',border:'1px solid #a855f7',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                    <div style={{fontWeight:700,fontSize:11,marginBottom:7}}>🏭 Инвестиционный анализ</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
                      <KCard label="Доп.прибыль" value={`${(extraProfit/1000).toFixed(0)}K ₽`}/>
                      <KCard label="ROI" value={`${roi.toFixed(1)}%`}/>
                      <KCard label="Окупаемость" value={extraProfit>0?`${(2000000/extraProfit).toFixed(1)}л`:'∞'}/>
                    </div>
                  </div>
                )}
                {taskHistory.length>0&&(
                  <div style={{background:'#fff',borderRadius:9,padding:'8px 12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                    <div style={{fontWeight:700,fontSize:11,marginBottom:5,color:'#374151'}}>📈 Последние расчёты</div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                      <thead>
                        <tr style={{borderBottom:'1.5px solid #e5e7eb'}}>
                          {['#','С/с','Прибыль','Маржа'].map(h=>(
                            <th key={h} style={{padding:'2px 6px',textAlign:h==='#'?'left':'right',color:'#9ca3af',fontWeight:600}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {taskHistory.map((h,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                            <td style={{padding:'2px 6px',color:'#6b7280'}}>{i+1}</td>
                            <td style={{padding:'2px 6px',textAlign:'right'}}>{h.costPerUnit?.toLocaleString('ru')}</td>
                            <td style={{padding:'2px 6px',textAlign:'right'}}>{(h.profit/1000)?.toFixed(0)}K</td>
                            <td style={{padding:'2px 6px',textAlign:'right',fontWeight:700,color:h.margin>bm.margin?'#22c55e':'#ef4444'}}>{h.margin}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FINISH MODAL */}
      {finished&&(
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:500}}>
            <div style={{textAlign:'center',marginBottom:18}}>
              <div style={{fontSize:48}}>🏆</div>
              <h2 className="modal-title" style={{margin:'6px 0 2px'}}>Практика завершена!</h2>
              <p style={{color:'#6b7280',margin:0,fontSize:12}}>Цифровой двойник «МеталлПром»</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
              <div className="card stat-card"><div className="stat-value" style={{color:'#2A7DE1'}}>{totalPts}</div><div className="stat-label">Баллов</div></div>
              <div className="card stat-card"><div className="stat-value" style={{color:'#22c55e'}}>{totalDone}/{TASKS.length}</div><div className="stat-label">Заданий</div></div>
              <div className="card stat-card"><div className="stat-value">{Object.values(taskErrors).reduce((a,b)=>a+b,0)}</div><div className="stat-label">Ошибок</div></div>
            </div>
            <div style={{marginBottom:12}}>
              {TASKS.map((t,i)=>(
                <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',marginBottom:4,borderRadius:7,background:completedTasks[t.id]?'#f0fdf4':'#fef2f2'}}>
                  <span style={{fontSize:12}}>{t.icon} {['Себестоимость','Смены','Цена','Инвестиции','Антикризис'][i]}</span>
                  <span style={{fontWeight:700,color:completedTasks[t.id]?'#22c55e':'#ef4444'}}>
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
