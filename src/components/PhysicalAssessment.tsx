import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { 
  Home, BarChart2, Plus, ChevronRight, Clock, TrendingUp, 
  Droplets, Flame, User, RefreshCw, Bell, Monitor, 
  Activity, Calendar, FileText, ChevronLeft, Info,
  Settings, History as HistoryIcon, Map, X
} from 'lucide-react';

// --- COMPONENTES DE INTERFACE COM LETRAS GROSSAS ---

const BoldText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`font-black tracking-tight ${className}`}>{children}</span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Alto': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Saudável': 'bg-green-100 text-green-700 border-green-300',
    'Excelente': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'Obeso': 'bg-red-100 text-red-700 border-red-300',
    'Baixo': 'bg-blue-100 text-blue-700 border-blue-300',
    'Moderado': 'bg-orange-100 text-orange-700 border-orange-300',
  };
  return (
    <div className={`text-[10px] font-black px-2 py-0.5 rounded border-2 flex items-center gap-1 ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status} <div className="w-1 h-3 bg-current rounded-full"></div>
    </div>
  );
};

const MetricRow = ({ icon: Icon, label, value, status, color = "text-slate-600" }: any) => (
  <div className="flex items-center justify-between py-3.5 border-b-2 border-slate-50 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl bg-slate-50 ${color}`}><Icon size={18} strokeWidth={3} /></div>
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
    </div>
    <div className="flex flex-col items-end">
      <span className="text-base font-black text-slate-900">{value}</span>
      {status && <StatusBadge status={status} />}
    </div>
  </div>
);

// --- TELAS ---

// 1. MENU INICIAL
const HomeView = ({ assessment, previous, onNavigate }: any) => {
  const weightDiff = previous 
    ? (parseFloat(assessment.weight) - parseFloat(previous.weight)).toFixed(2)
    : "0.00";
  const diffPrefix = parseFloat(weightDiff) > 0 ? "+" : "";
  const weightDiffColor = parseFloat(weightDiff) > 0 ? "text-red-500" : "text-green-500";

  return (
  <div className="space-y-4 pb-28 animate-in fade-in duration-500">
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">balança de gordura</h2>
          <p className="text-[10px] font-bold text-slate-400">{assessment.date} {assessment.time}</p>
        </div>
        <button onClick={() => onNavigate('history')} className="text-[10px] font-black text-blue-600 border-2 border-blue-100 px-4 py-1.5 rounded-full hover:bg-blue-50">História</button>
      </div>
      
      <div className="flex items-center justify-center gap-2 my-6">
        <span className="text-6xl font-black text-slate-800 tracking-tighter">{assessment.weight}</span>
        <span className="text-xl font-black text-slate-300 mt-6 uppercase">Kg</span>
      </div>

      <div className="h-2.5 w-full flex rounded-full overflow-hidden mb-6 bg-slate-100">
        <div className="w-1/4 bg-sky-300"></div>
        <div className="w-1/4 bg-green-400"></div>
        <div className="w-1/4 bg-yellow-400"></div>
        <div className="w-1/4 bg-red-500"></div>
      </div>

      <div className="flex justify-between">
        <div className={`text-[11px] font-black ${weightDiffColor}`}>{diffPrefix}{weightDiff} <span className="font-bold text-[9px] block opacity-60 text-slate-500">Comparado com a última vez</span></div>
        <div className="text-[11px] font-black text-slate-300">-- <span className="font-bold text-[9px] block text-right opacity-60">Melhor em 30 dias</span></div>
      </div>

      <button onClick={() => onNavigate('metrics')} className="w-full bg-blue-600 text-white font-black py-4 rounded-3xl mt-8 shadow-lg shadow-blue-200 active:scale-95 transition-transform uppercase tracking-wider text-xs">
        Métricas Completas
      </button>
    </div>

    {/* Widgets de Opções */}
    <div className="grid gap-3">
      {[
        { icon: TrendingUp, label: "Evolução de Peso", desc: `${diffPrefix}${weightDiff} Kg mudanças recentes`, color: "text-blue-500", bg: "bg-blue-50", action: () => onNavigate('history') },
        { icon: Activity, label: "Perímetros", desc: `Cintura: ${assessment.waist || '---'} | Abdomen: ${assessment.abdomen || '---'}`, color: "text-blue-600", bg: "bg-blue-100", action: () => onNavigate('metrics') },
        { icon: Activity, label: "Dobras Cutâneas", desc: `Soma: ${assessment.skinfoldSum || '---'} mm`, color: "text-indigo-500", bg: "bg-indigo-50", action: () => onNavigate('metrics') }
      ].map((item, idx) => (
        <div key={idx} onClick={item.action} className="bg-white p-5 rounded-[1.8rem] flex items-center justify-between shadow-sm border border-slate-50 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color}`}><item.icon size={22} strokeWidth={3}/></div>
            <div>
              <p className="text-sm font-black text-slate-800 tracking-tight">{item.label}</p>
              <p className="text-[10px] font-bold text-slate-400">{item.desc}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-300" strokeWidth={3} />
        </div>
      ))}
    </div>
  </div>
)};

// 2. DETALHES COMPLETOS
const MetricsView = ({ assessment }: any) => (
  <div className="space-y-4 pb-28 animate-in slide-in-from-bottom-4 duration-500">
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-black text-slate-800">Métricas corporais</h2>
        <StatusBadge status={assessment.weightStatus || "Alto"} />
      </div>

      <div className="flex flex-col items-center mb-10">
         <span className="text-6xl font-black text-slate-900 tracking-tighter">{assessment.weight}</span>
         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Kilogramas</span>
         <p className="text-[10px] font-bold text-slate-300 mt-2">{assessment.date} {assessment.time}</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Composição Corporal & Bioimpedância</h3>
          <div className="space-y-1">
            <MetricRow icon={User} label="Peso (Kg)" value={assessment.weight} status="Alto" />
            <MetricRow icon={Activity} label="IMC" value={assessment.bmi} status="Alto" />
            <MetricRow icon={User} label="Gordura (%)" value={assessment.bodyFat} status="Obeso" />
            <MetricRow icon={User} label="Peso da gordura (Kg)" value={assessment.fatWeight} status="Obeso" />
            <MetricRow icon={Activity} label="Percentual de massa muscular (%)" value={assessment.skeletalMuscle} status="Saudável" />
            <MetricRow icon={Activity} label="Peso de massa muscular (Kg)" value={assessment.skeletalMuscleWeight} status="Saudável" />
            <MetricRow icon={Droplets} label="Água (%)" value={assessment.water} status="Baixo" />
            <MetricRow icon={Droplets} label="Peso da água (Kg)" value={assessment.waterWeight} status="Baixo" />
            <MetricRow icon={Flame} label="TMB (Kcal)" value={assessment.metabolism} status="Alto" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Dobras Cutâneas</h3>
          <div className="space-y-1">
            <MetricRow icon={Activity} label="Peitoral" value={assessment.skinfoldChest || "0,0"} />
            <MetricRow icon={Activity} label="Abdominal" value={assessment.skinfoldAbdo || "0,0"} />
            <MetricRow icon={Activity} label="Coxa Medial" value={assessment.skinfoldThigh || "0,0"} />
            <MetricRow icon={User} label="Soma das dobras" value={assessment.skinfoldSum || "0,0"} />
            <MetricRow icon={Droplets} label="Densidade Corporal" value={assessment.bodyDensity || "1,1"} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Perimetria (cm)</h3>
          <div className="space-y-1">
            <MetricRow icon={Activity} label="Tórax" value={assessment.chest || "---"} />
            <MetricRow icon={Activity} label="Cintura" value={assessment.waist || "---"} />
            <MetricRow icon={Activity} label="Abdomen" value={assessment.abdomen || "---"} />
            <MetricRow icon={Activity} label="Quadril" value={assessment.hip || "---"} />
            <MetricRow icon={Activity} label="Coxa Dir. / Esq. (PX)" value={`${assessment.thighRightPx || "---"} / ${assessment.thighLeftPx || "---"}`} />
            <MetricRow icon={Activity} label="Coxa Dir. / Esq. (DT)" value={`${assessment.thighRightDt || "---"} / ${assessment.thighLeftDt || "---"}`} />
            <MetricRow icon={Activity} label="Panturrilha Dir. / Esq." value={`${assessment.calfRight || "---"} / ${assessment.calfLeft || "---"}`} />
            <MetricRow icon={Activity} label="Braço Dir. / Esq." value={`${assessment.armRight || "---"} / ${assessment.armLeft || "---"}`} />
            <MetricRow icon={Activity} label="Antebraço Dir. / Esq." value={`${assessment.forearmRight || "---"} / ${assessment.forearmLeft || "---"}`} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 3. ANÁLISE DO RELATÓRIO
const AnalysisView = ({ assessment }: any) => (
  <div className="space-y-6 pb-28 animate-in slide-in-from-right duration-500">
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm">
      <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-tight">Análise da composição corporal</h3>
      <div className="space-y-4">
        {[
          { label: "Água", value: assessment.water + "%", status: "Baixo", color: "bg-blue-400" },
          { label: "Gordura", value: assessment.bodyFat + "%", status: "Obeso", color: "bg-red-400" },
          { label: "Proteína", value: assessment.protein + "%", status: "Saudável", color: "bg-green-400" },
          { label: "Ossos", value: assessment.boneMass + "kg", status: "Saudável", color: "bg-green-400" }
        ].map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-black">
              <span className="text-slate-500">{item.label}</span>
              <span className={item.status === 'Obeso' ? 'text-red-500' : item.status === 'Baixo' ? 'text-blue-500' : 'text-green-600'}>{item.status}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${item.color}`} style={{ width: i === 1 ? '85%' : '45%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm">
      <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-tight">Análise do tipo de corpo</h3>
      <div className="grid grid-cols-3 gap-2">
        {["Atleta", "Obeso Muscular", "Obesidade", "Muscular", "Saudável", "Acima do Peso", "Magro", "Magro Esq.", "Oculta"].map((t, i) => (
          <div key={i} className={`text-[9px] p-2 h-14 flex items-center justify-center text-center rounded-2xl border-2 font-black leading-tight ${i === 2 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
            {t}
          </div>
        ))}
      </div>
      <div className="mt-6 p-5 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100">
        <p className="text-[11px] font-extrabold text-slate-600 leading-relaxed">
          O seu tipo de corpo é <span className="text-red-600">obeso</span>, com excesso de gordura corporal e peso. Como mestre em ciências do exercício, André, você sabe que isso requer atenção estratégica no treinamento de força.
        </p>
      </div>
    </div>

    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm">
      <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-tight">Dicas de controle de peso</h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-xs font-black mb-2">
            <span>Peso (Kg)</span>
            <span className="text-blue-600">-22.4</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full"><div className="w-2/3 h-full bg-blue-500 rounded-full"></div></div>
          <p className="text-[10px] font-black text-center text-blue-300 mt-2">Peso ideal 70.0kg</p>
        </div>
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
           <span className="text-[11px] font-black text-slate-500">Massa muscular</span>
           <span className="text-sm font-black text-blue-600">+6.9</span>
        </div>
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
           <span className="text-[11px] font-black text-slate-500">Gordura</span>
           <span className="text-sm font-black text-blue-600">-12.2</span>
        </div>
      </div>
    </div>
  </div>
);

// 4. COMPARATIVO
const ComparisonView = ({ current, previous }: { current: any, previous: any }) => {
  if (!previous) return <div className="p-10 text-center font-black text-slate-300 uppercase tracking-widest leading-relaxed opacity-60">Apenas um registro encontrado para comparação. Continue registrando suas avaliações para ver a evolução!</div>;

  const compare = (key: string) => {
    const currRaw = current[key];
    const prevRaw = previous[key];
    
    if (currRaw === undefined || prevRaw === undefined) return null;

    const curr = parseFloat(currRaw);
    const prev = parseFloat(prevRaw);
    
    if (isNaN(curr) || isNaN(prev)) return null;

    const diff = curr - prev;
    const isIncrease = diff > 0;
    return {
      diff: Math.abs(diff).toFixed(2),
      isIncrease,
      percent: ((diff / prev) * 100).toFixed(1)
    };
  };

  const metrics = [
    { label: "Peso", key: "weight", unit: "Kg" },
    { label: "Gordura Corporal", key: "bodyFat", unit: "%" },
    { label: "Massa Muscular", key: "muscleWeight", unit: "Kg" },
    { label: "Água", key: "water", unit: "%" },
    { label: "Gordura Visceral", key: "visceralFat", unit: "" },
    { label: "Metabolismo", key: "metabolism", unit: "kcal" },
    { label: "Cintura", key: "waist", unit: "cm" },
    { label: "Quadril", key: "hip", unit: "cm" },
    { label: "Tórax", key: "chest", unit: "cm" },
  ];

  return (
    <div className="space-y-4 pb-28 animate-in slide-in-from-right duration-500">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
        <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-500" strokeWidth={3}/>
          Comparativo: {previous.date} ➔ {current.date}
        </h3>
        
        <div className="space-y-4">
          {metrics.map((m, i) => {
            const stats = compare(m.key);
            const val = current[m.key] || "---";
            
            if (stats === null) {
              return (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 italic">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{m.label}</p>
                    <p className="text-sm font-black text-slate-300">Sem dados</p>
                  </div>
                  <div className="text-right text-[10px] font-black text-slate-200">---</div>
                </div>
              );
            }

            const isGood = (m.key === 'muscleWeight' || m.key === 'water' || m.key === 'metabolism') 
              ? stats.isIncrease 
              : !stats.isIncrease;

            return (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border-2 border-white shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{m.label}</p>
                  <p className="text-sm font-black text-slate-700">{val} <span className="text-[10px] opacity-40">{m.unit}</span></p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center justify-end gap-1 font-black text-sm ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stats.isIncrease ? '+' : '-'}{stats.diff} {m.unit}
                    {stats.isIncrease ? <TrendingUp size={14} strokeWidth={3}/> : <TrendingUp size={14} className="rotate-180" strokeWidth={3}/>}
                  </div>
                  <p className={`text-[9px] font-bold ${isGood ? 'text-emerald-600/60' : 'text-red-600/60'}`}>
                    {stats.percent}% vs anterior
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
        <h3 className="text-sm font-black mb-3 uppercase tracking-wider">Veredito do Mestre</h3>
        <p className="text-xs font-medium leading-relaxed opacity-90">
          André, comparando com {previous.date}, você teve uma variação de <BoldText>{(parseFloat(current.weight) - parseFloat(previous.weight)).toFixed(1)}kg</BoldText> no peso total. 
          {parseFloat(current.muscleWeight) > parseFloat(previous.muscleWeight) ? " A massa muscular subiu, o que é excelente para manter a taxa metabólica ativa." : " Atenção à massa muscular, busque manter os estímulos de força."}
        </p>
      </div>
    </div>
  );
};

// 5. GRÁFICA DE EVOLUÇÃO (ESTILO DASHBOARD ESCURO)
const DashboardCharts = ({ assessments }: { assessments: any[] }) => {
  const [activeMetric, setActiveMetric] = useState<'weight' | 'bodyFat' | 'muscle'>('weight');

  const chartData = assessments.map(a => ({
    date: a.date.split('/').slice(0, 2).join('/'), // DD/MM
    weight: parseFloat(a.weight),
    bodyFat: parseFloat(a.bodyFat),
    muscle: parseFloat(a.skeletalMuscleWeight || a.muscleWeight || 0),
    fullName: a.date
  })).sort((a, b) => new Date(a.fullName.replace(/\//g, '-')).getTime() - new Date(b.fullName.replace(/\//g, '-')).getTime());

  const config = {
    weight: { color: '#2563eb', label: 'PESO (KG)', dataKey: 'weight' }, // Blue 600
    bodyFat: { color: '#3b82f6', label: 'GORDURA (%)', dataKey: 'bodyFat' }, // Blue 500
    muscle: { color: '#10b981', label: 'MASSA MUSC. (KG)', dataKey: 'muscle' }
  };

  const current = config[activeMetric];

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 mb-8 overflow-hidden">
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-2 text-blue-600">
          <TrendingUp size={14} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Análise de Tendência</span>
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Evolução Corporal</h3>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
        {(Object.keys(config) as Array<keyof typeof config>).map((key) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
              activeMetric === key 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
              : 'bg-slate-50 border-slate-50 text-slate-400 hover:text-slate-600'
            }`}
          >
            {config[key].label}
          </button>
        ))}
      </div>

      <div className="h-72 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 40, right: 45, left: 45, bottom: 20 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={current.color} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={current.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
              dy={15}
            />
            <YAxis 
              hide
              domain={['auto', 'auto']}
            />
            <Tooltip 
              cursor={{ stroke: current.color + '20', strokeWidth: 2 }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '1.2rem', 
                border: 'none',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                padding: '12px'
              }}
              itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 900 }}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', fontWeight: 800 }}
            />
            <Area 
              type="monotone" 
              dataKey={current.dataKey} 
              stroke={current.color} 
              strokeWidth={5} 
              fillOpacity={1}
              fill="url(#colorMetric)"
              animationDuration={1500}
              dot={{ r: 5, fill: '#fff', stroke: current.color, strokeWidth: 3 }}
              activeDot={{ r: 7, fill: '#fff', stroke: current.color, strokeWidth: 4 }}
            >
              <LabelList 
                dataKey={current.dataKey} 
                content={(props: any) => {
                  const { x, y, value } = props;
                  return (
                    <text 
                      x={x} 
                      y={y - 18} 
                      fill={current.color} 
                      fontSize={11} 
                      fontWeight={900} 
                      textAnchor="middle"
                      className="opacity-90"
                    >
                      {value}
                    </text>
                  );
                }}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 6. NOVA AVALIAÇÃO (Formulário Completo)
const NewAssessmentForm = ({ onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString().slice(0,5),
    weight: '', height: '180', bmi: '', bodyFat: '', fatWeight: '',
    skeletalMuscle: '', skeletalMuscleWeight: '', muscleRate: '', muscleWeight: '',
    water: '', waterWeight: '', visceralFat: '', boneMass: '', metabolism: '',
    protein: '', obesityLevel: '', metabolicAge: '', lbm: '', realAge: '35'
  });

  const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-3 bg-white rounded-2xl shadow-sm border-2 border-slate-50"><ChevronLeft strokeWidth={3}/></button>
        <h2 className="text-lg font-black text-slate-800">Nova Avaliação Física</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm space-y-5 border border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
              <input name="date" type="date" value={formData.date} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-2xl border-none text-xs font-black outline-none focus:ring-4 ring-blue-100" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (Kg)</label>
              <input name="weight" type="number" step="0.01" value={formData.weight} onChange={handleChange} placeholder="0.00" className="w-full bg-slate-50 p-4 rounded-2xl border-none text-xs font-black outline-none focus:ring-4 ring-blue-100" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gordura %</label>
              <input name="bodyFat" type="number" step="0.1" value={formData.bodyFat} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-2xl border-none text-xs font-black outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Músculo %</label>
              <input name="muscleRate" type="number" step="0.1" value={formData.muscleRate} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-2xl border-none text-xs font-black outline-none" />
            </div>
          </div>
          
          <p className="text-[9px] font-black text-slate-300 uppercase text-center py-2">O sistema salvará todos os outros campos editáveis no histórico</p>
        </div>

        <button onClick={() => onSave(formData)} className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-200 uppercase tracking-widest text-sm">
          Salvar Dados da Balança
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function PhysicalAssessment({ assessments, onSave, onClose }: { assessments: any[], onSave: (data: any) => void, onClose: () => void }) {
  const [view, setView] = useState('history'); 
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleSave = (data: any) => {
    const newRecord = { ...data, id: Date.now() };
    onSave(newRecord);
    setView('history');
  };

  const handleBack = () => {
    if (view === 'history') {
      onClose();
    } else {
      setView('history');
    }
  };

  const current = selectedIndex >= 0 ? assessments[selectedIndex] : null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 font-sans selection:bg-blue-100 overflow-hidden flex flex-col">
      {/* Header Fixo */}
      <header className="p-6 flex justify-between items-center bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 border-2 border-white shadow-sm hover:bg-slate-200 transition-colors">
            <X size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">Avaliação Física</h1>
            <p className="text-[9px] font-black text-blue-500 uppercase mt-1">Painel de Evolução</p>
          </div>
        </div>
        <div className="flex gap-4 text-slate-400">
          <Monitor size={20} strokeWidth={3} />
          <RefreshCw size={20} strokeWidth={3} />
        </div>
      </header>

      {/* Tabs Superiores (Apenas quando visualizando uma avaliação específica) */}
      {current && (view === 'metrics' || view === 'analysis' || view === 'comparison') && (
        <div className="px-6 mb-6">
          <div className="bg-slate-50 p-1.5 rounded-[1.8rem] flex shadow-inner border border-slate-100 overflow-x-auto no-scrollbar">
            <button onClick={() => setView('metrics')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black rounded-[1.4rem] transition-all uppercase tracking-widest shrink-0 ${view === 'metrics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400'}`}>Métricas</button>
            <button onClick={() => setView('analysis')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black rounded-[1.4rem] transition-all uppercase tracking-widest shrink-0 ${view === 'analysis' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400'}`}>Análise</button>
            <button onClick={() => setView('comparison')} className={`flex-1 min-w-[90px] py-3 text-[9px] font-black rounded-[1.4rem] transition-all uppercase tracking-widest shrink-0 ${view === 'comparison' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400'}`}>Comparativo</button>
          </div>
        </div>
      )}

      {/* Área de Conteúdo */}
      <main className="px-6 flex-1 overflow-y-auto no-scrollbar pb-32">
        {view === 'new' && <NewAssessmentForm onSave={handleSave} onCancel={() => setView('history')} />}
        {view === 'metrics' && current && <MetricsView assessment={current} />}
        {view === 'analysis' && current && <AnalysisView assessment={current} />}
        {view === 'comparison' && current && <ComparisonView current={current} previous={selectedIndex > 0 ? assessments[selectedIndex - 1] : null} />}
        {view === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* NOVO DASHBOARD DE GRÁFICOS NO TOPO */}
            <DashboardCharts assessments={assessments} />

            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-6">Histórico de Registros</h3>
            <div className="space-y-4 pb-12">
              {assessments.slice().reverse().map((item, idx) => {
                const actualIdx = assessments.length - 1 - idx;
                return (
                  <div key={item.id || idx} 
                    onClick={() => { setSelectedIndex(actualIdx); setView('metrics'); }}
                    className={`bg-white p-5 rounded-[2rem] flex justify-between items-center shadow-sm border-2 transition-all ${selectedIndex === actualIdx ? 'border-blue-500 shadow-blue-50' : 'border-slate-50 cursor-pointer hover:border-blue-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600"><FileText size={22} strokeWidth={3}/></div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{item.date}</p>
                        <p className="text-[10px] font-bold text-slate-300">Bioimpedância Completa</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-800">{item.weight} <span className="text-[10px] text-slate-300 uppercase">Kg</span></p>
                      <StatusBadge status={item.weightStatus} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Dock Inferior */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center py-4 px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[3rem] z-20">
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1.5 ${view === 'history' ? 'text-blue-600' : 'text-slate-300'}`}>
          <HistoryIcon size={24} strokeWidth={view === 'history' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Histórico</span>
        </button>
        <div className="relative -top-10 scale-125">
          <button onClick={() => setView('new')} className="bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-400 border-4 border-white active:scale-90 transition-transform">
            <Plus size={28} strokeWidth={4} />
          </button>
        </div>
        <button 
          onClick={() => { 
            if (selectedIndex === -1 && assessments.length > 0) setSelectedIndex(assessments.length - 1); 
            setView('metrics'); 
          }} 
          className={`flex flex-col items-center gap-1.5 ${view === 'metrics' || view === 'analysis' || view === 'comparison' ? 'text-blue-600' : 'text-slate-300'}`}
        >
          <BarChart2 size={24} strokeWidth={view === 'metrics' || view === 'analysis' || view === 'comparison' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Relatórios</span>
        </button>
      </nav>
    </div>
  );
}
