import React, { useState, useMemo } from 'react';
import { Pill, Droplet, RefreshCcw, CheckCircle2, Timer, Beaker, AlertCircle, List, ChevronDown, ChevronUp, ShoppingCart, CalendarDays } from 'lucide-react';

export const PoviztraControl = () => {
  // --- ESTADOS ---
  const [globalHistory, setGlobalHistory] = useState<{ id: number; name: string; timestamp: string }[]>([]);
  const [expandedSection, setExpandedSection] = useState('summary');

  const [showPrescription, setShowPrescription] = useState(false);

  // Poviztra: 300 clicks totais
  const [ozempic, setOzempic] = useState({
    name: 'Poviztra',
    totalUnits: 300,
    remainingUnits: 300,
    purchaseDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
  });

  // Vitaminas
  const [vitamins, setVitamins] = useState<Record<string, any>>({
    b12: { name: 'Vitamina B12', lastDose: null, nextDose: null, cyclePhase: 'active' },
    vitD: { name: 'Vitamina D', lastDose: null, nextDose: null, cyclePhase: 'active' },
    iron: { name: 'Ferro', lastDose: null, nextDose: null },
    vonau: { name: 'Vonau Flash (SOS)', lastDose: null, nextDose: null, description: '8mg - Para náuseas/vômitos' }
  });

  // EXAME 06/01/2026
  const examData = useMemo(() => ({
    date: '06/01/2026',
    nextExamDate: '2026-04-06',
    groups: [
      {
        title: 'Hemograma Completo',
        items: [
          { label: 'Hemácias', value: '4.60', unit: 'mi/mm3', ref: '4.50-6.50', status: 'normal' },
          { label: 'Hemoglobina', value: '14.3', unit: 'g/dL', ref: '13.5-18.0', status: 'normal' },
          { label: 'Hematócrito', value: '42.4', unit: '%', ref: '40.0-54.0', status: 'normal' },
          { label: 'Plaquetas', value: '353000', unit: '/mm3', ref: '150k-450k', status: 'normal' }
        ]
      },
      {
        title: 'Glicemia e Insulina',
        items: [
          { label: 'Glicose', value: '100', unit: 'mg/dL', ref: '70-99', status: 'warning' },
          { label: 'HbA1c', value: '4.6', unit: '%', ref: '< 5.7', status: 'normal' },
          { label: 'Insulina', value: '5.1', unit: 'µUI/mL', ref: '2.6-24.9', status: 'normal' }
        ]
      },
      {
        title: 'Vitaminas e Minerais',
        items: [
          { label: 'Vitamina D', value: '29.1', unit: 'ng/mL', ref: '30-60', status: 'warning' },
          { label: 'Vitamina B12', value: '525', unit: 'pg/mL', ref: '197-771', status: 'normal' },
          { label: 'Ferritina', value: '79.9', unit: 'ng/mL', ref: '30-400', status: 'normal' },
          { label: 'Zinco', value: '94', unit: 'µg/dL', ref: '70-120', status: 'normal' }
        ]
      },
      {
        title: 'Rins e Fígado',
        items: [
          { label: 'Creatinina', value: '1.27', unit: 'mg/dL', ref: '0.6-1.3', status: 'warning' },
          { label: 'Ureia', value: '39.0', unit: 'mg/dL', ref: '15-50', status: 'normal' },
          { label: 'TGO', value: '29', unit: 'U/L', ref: 'Até 35', status: 'normal' }
        ]
      }
    ]
  }), []);

  // --- LÓGICA DE TEMPO E DOSAGEM ---
  const stats = useMemo(() => {
    const start = new Date(ozempic.startDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.ceil((diffDays + 1) / 7) || 1;
    const currentDose = currentWeek <= 2 ? 4 : 6;

    let tempUnits = ozempic.remainingUnits;
    let daysRemaining = 0;
    let simDay = 0;

    while (tempUnits >= 4) {
      const simDiffDays = diffDays + simDay;
      const simWeek = Math.ceil((simDiffDays + 1) / 7);
      const simDose = simWeek <= 2 ? 4 : 6;
      if (tempUnits < simDose) break;
      tempUnits -= simDose;
      daysRemaining++;
      simDay++;
      if (simDay > 200) break;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysRemaining);

    return {
      currentWeek,
      currentDose,
      daysRemaining,
      weeksRemaining: (daysRemaining / 7).toFixed(1),
      endDate: endDate.toLocaleDateString('pt-BR')
    };
  }, [ozempic.startDate, ozempic.remainingUnits]);

  const daysToExam = useMemo(() => {
    const diff = new Date(examData.nextExamDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [examData.nextExamDate]);

  // --- AÇÕES ---
  const addToHistory = (name: string) => {
    setGlobalHistory(prev => [{ id: Date.now(), name, timestamp: new Date().toLocaleString('pt-BR') }, ...prev].slice(0, 50));
  };

  const takePoviztra = () => {
    if (ozempic.remainingUnits < stats.currentDose) return;
    setOzempic(prev => ({ ...prev, remainingUnits: prev.remainingUnits - stats.currentDose }));
    addToHistory(`Dose Poviztra (${stats.currentDose} clicks - Semana ${stats.currentWeek})`);
  };

  const takeVitamin = (key: string) => {
    const now = new Date();
    setVitamins(prev => {
      const v = prev[key];
      let next = new Date(now);
      let phase = v.cyclePhase;
      if (key === 'iron') next.setDate(next.getDate() + 90);
      else {
        if (phase === 'active') { next.setDate(next.getDate() + 15); phase = 'resting'; }
        else { next.setDate(next.getDate() + 60); phase = 'active'; }
      }
      return { ...prev, [key]: { ...v, lastDose: now, nextDose: next, cyclePhase: phase } };
    });
    addToHistory(`Tomou ${vitamins[key].name}`);
  };

  const getOzempicColor = (units: number) => {
    const p = (units / 300) * 100;
    if (p > 75) return 'bg-blue-600';
    if (p > 50) return 'bg-emerald-500';
    if (p > 20) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6 pb-32 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* PRESCRIÇÃO MÉDICA OFICIAL */}
      <section className="bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-white/10 overflow-hidden relative">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Prescrição Ativa</span>
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Nutrobarra Especial</h2>
          </div>
          <button 
            onClick={() => setShowPrescription(!showPrescription)}
            className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all"
          >
            {showPrescription ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-2xl border border-white/5 relative z-10">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black text-xs">MB</div>
          <div>
            <p className="text-xs font-black text-white italic">Dr. Murilo Oliveira Bizerra</p>
            <p className="text-[9px] font-bold text-white/40 uppercase">CRM-RJ: 5201287958 • 24/04/2026</p>
          </div>
        </div>

        {showPrescription && (
          <div className="space-y-4 animate-in slide-in-from-top-4 duration-300 relative z-10 border-t border-white/10 pt-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">Protocolo de Aplicação</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60 font-bold">Semana 1 e 2</span>
                  <span className="text-white font-black">4 clicks / dia</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60 font-bold">Semana 3 em diante</span>
                  <span className="text-white font-black">6 clicks / dia</span>
                </div>
                <p className="text-[9px] text-white/40 mt-2 italic leading-relaxed">
                  * Girar levemente o tambor até ouvir o click. Aplicar via subcutânea diariamente conforme orientado.
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-3 tracking-widest">Orientações Obrigatórias</p>
              <ul className="space-y-2">
                {[
                  "Dieta hipocalórica (elaborada por nutricionista)",
                  "Exercício físico regular (musculação)",
                  "Hidratação adequada",
                  "Evitar alimentos gordurosos e álcool"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-white/80">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
              <p className="text-[10px] font-black text-amber-500 uppercase mb-1 tracking-widest">Suporte a Náuseas</p>
              <p className="text-[11px] font-black text-white/90">Vonau Flash 8mg</p>
              <p className="text-[10px] text-white/40 mt-1">Tomar 1 cp até de 8/8 horas SOS caso náusea/vômitos.</p>
            </div>
          </div>
        )}
        <List className="absolute -right-6 -bottom-6 h-32 w-32 text-white/5" />
      </section>
      
      {/* CANETA POVIZTRA */}
      <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Droplet className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight italic">Gestão Poviztra</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Injetável • 300 clicks</p>
            </div>
          </div>
          <button 
            onClick={() => setOzempic(p => ({...p, remainingUnits: 300, startDate: new Date().toISOString().split('T')[0]}))}
            className="p-2.5 bg-white/10 rounded-2xl hover:bg-rose-500/20 active:scale-90 transition-all border border-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><ShoppingCart className="w-3 h-3"/> Compra</label>
              <input type="date" value={ozempic.purchaseDate} onChange={(e) => setOzempic(p => ({...p, purchaseDate: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Início</label>
              <input type="date" value={ozempic.startDate} onChange={(e) => setOzempic(p => ({...p, startDate: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-xs font-bold" />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-black text-slate-800 uppercase">Carga: {ozempic.remainingUnits} u</span>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg uppercase">Semana {stats.currentWeek} • {stats.currentDose} clicks</span>
            </div>
            <div className="w-full h-14 bg-slate-100 rounded-2xl border-4 border-slate-50 overflow-hidden shadow-inner p-1">
              <div 
                className={`h-full transition-all duration-1000 rounded-xl shadow-lg ${getOzempicColor(ozempic.remainingUnits)}`}
                style={{ width: `${(ozempic.remainingUnits / 300) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-6 mb-6 text-white relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 opacity-70">Duração</p>
                <p className="text-2xl font-black text-emerald-400 leading-none tracking-tighter">{stats.daysRemaining} Dias</p>
                <p className="text-xs font-bold text-slate-400 mt-2 italic">{stats.weeksRemaining} Semanas</p>
              </div>
              <div className="text-right border-l border-white/5 pl-4 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 opacity-70">Aproximadamente em</p>
                <p className="text-xl font-black text-white tracking-tight">{stats.endDate}</p>
              </div>
            </div>
            <Timer className="absolute -right-6 -bottom-6 h-28 w-28 text-white/5" />
          </div>

          <button 
            onClick={takePoviztra} 
            disabled={ozempic.remainingUnits < stats.currentDose}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="h-6 w-6" /> 
            MARCAR {stats.currentDose} CLICKS
          </button>
        </div>
      </section>

      {/* MAPA DE SAÚDE */}
      <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Beaker className="h-6 w-6" />
            <h2 className="text-xl font-black uppercase tracking-tight italic">Mapa Biológico</h2>
          </div>
          <div className="text-right bg-white/20 px-3 py-1.5 rounded-2xl border border-white/20">
            <p className="text-[9px] uppercase font-black opacity-80">Próximo Exame</p>
            <p className="text-sm font-black">{daysToExam} dias</p>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {examData.groups.map((group, idx) => (
            <div key={idx} className="bg-slate-50 rounded-[1.8rem] overflow-hidden border border-slate-100">
              <button 
                onClick={() => setExpandedSection(expandedSection === group.title ? '' : group.title)}
                className="w-full flex justify-between items-center p-4 hover:bg-slate-100 transition-colors"
              >
                <span className="font-black text-slate-700 text-[10px] uppercase tracking-[0.1em]">{group.title}</span>
                {expandedSection === group.title ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {expandedSection === group.title && (
                <div className="p-4 grid grid-cols-1 gap-2 bg-white">
                  {group.items.map((item, i) => (
                    <div key={i} className={`flex justify-between items-center p-3.5 rounded-2xl border-2 ${item.status === 'warning' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-50'}`}>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{item.label}</p>
                        <p className="text-sm font-black text-slate-800">{item.value} <span className="text-[10px] text-slate-400 ml-1 italic">{item.unit}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-300 font-bold uppercase">REF: {item.ref}</p>
                        {item.status === 'warning' && <AlertCircle className="h-4 w-4 text-rose-500 ml-auto mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* VITAMINAS / OUTROS INJETÁVEIS */}
      <div className="space-y-4">
        {Object.keys(vitamins).map(key => (
          <div key={key} className="bg-white rounded-[2.2rem] p-6 border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${key === 'iron' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} shadow-inner`}>
                {key === 'iron' ? <Droplet className="h-7 w-7" /> : <Pill className="h-7 w-7" />}
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tighter italic">{vitamins[key].name}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-50 px-2 py-0.5 rounded-md inline-block mt-1">
                  {key === 'iron' ? 'Trimestral' : vitamins[key].cyclePhase === 'active' ? 'Ciclo 15 d' : 'Descanso 60 d'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] uppercase font-black text-slate-300">Próxima</p>
                <p className="font-black text-lg text-slate-800 tracking-tight">{vitamins[key].nextDose ? vitamins[key].nextDose.toLocaleDateString('pt-BR') : '--/--/--'}</p>
              </div>
              <button 
                onClick={() => takeVitamin(key)} 
                className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-90 transition-all flex items-center justify-center"
              >
                <CheckCircle2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* HISTÓRICO */}
      <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden">
        <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Atividade Recente</h2>
          <List className="h-4 w-4 text-slate-400" />
        </div>
        <div className="max-h-64 overflow-y-auto no-scrollbar">
          {globalHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-300 font-black uppercase text-[10px] italic">Sem registros no momento</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {globalHistory.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-800 italic">{item.name}</span>
                  <span className="text-slate-400 text-[10px]">{item.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

