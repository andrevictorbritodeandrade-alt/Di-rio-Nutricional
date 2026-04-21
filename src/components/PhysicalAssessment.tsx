import React, { useState } from 'react';
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
const HomeView = ({ assessment, onNavigate }: any) => (
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
        <div className="text-[11px] font-black text-slate-500">+0.9 <span className="font-bold text-[9px] block opacity-60">Comparado com a última vez</span></div>
        <div className="text-[11px] font-black text-slate-300">-- <span className="font-bold text-[9px] block text-right opacity-60">Melhor em 30 dias</span></div>
      </div>

      <button onClick={() => onNavigate('metrics')} className="w-full bg-blue-600 text-white font-black py-4 rounded-3xl mt-8 shadow-lg shadow-blue-200 active:scale-95 transition-transform uppercase tracking-wider text-xs">
        Balança vinculada
      </button>
    </div>

    {/* Widgets de Opções */}
    <div className="grid gap-3">
      {[
        { icon: Clock, label: "Jejum", desc: "Comece o seu plano de jejum!", color: "text-indigo-500", bg: "bg-indigo-50" },
        { icon: TrendingUp, label: "PesoTendência", desc: "+0.1 Kg mudanças recentes", color: "text-blue-500", bg: "bg-blue-50", action: () => onNavigate('history') },
        { icon: Droplets, label: "Beber água", desc: "Meta diária: 2000ml", color: "text-cyan-500", bg: "bg-cyan-50" },
        { icon: Flame, label: "Registro de calorias", desc: "0 Cal / Alvo 1879 Cal", color: "text-orange-500", bg: "bg-orange-50" },
        { icon: Activity, label: "Cintura", desc: "Sem dados", color: "text-blue-600", bg: "bg-blue-100" }
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
);

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

      <div className="space-y-1">
        <MetricRow icon={User} label="Peso (Kg)" value={assessment.weight} status="Alto" />
        <MetricRow icon={Activity} label="IMC" value={assessment.bmi} status="Alto" />
        <MetricRow icon={User} label="Gordura (%)" value={assessment.bodyFat} status="Obeso" />
        <MetricRow icon={User} label="Peso da gordura (Kg)" value={assessment.fatWeight} status="Obeso" />
        <MetricRow icon={Activity} label="Percentual da massa muscular esquelética (%)" value={assessment.skeletalMuscle} status="Saudável" />
        <MetricRow icon={Activity} label="Peso da massa muscular esquelética (Kg)" value={assessment.skeletalMuscleWeight} status="Saudável" />
        <MetricRow icon={Activity} label="Registro de massa muscular (%)" value={assessment.muscleRate} status="Excelente" />
        <MetricRow icon={Activity} label="Peso da massa muscular (Kg)" value={assessment.muscleWeight} status="Excelente" />
        <MetricRow icon={Droplets} label="Água (%)" value={assessment.water} status="Baixo" />
        <MetricRow icon={Droplets} label="Peso da água (Kg)" value={assessment.waterWeight} status="Baixo" />
        <MetricRow icon={Activity} label="Gordura visceral" value={assessment.visceralFat} status="Obeso" />
        <MetricRow icon={Activity} label="Ossos (Kg)" value={assessment.boneMass} status="Saudável" />
        <MetricRow icon={Flame} label="Metabolismo" value={assessment.metabolism} status="Alto" />
        <MetricRow icon={User} label="Proteína (%)" value={assessment.protein} status="Saudável" />
        <MetricRow icon={Activity} label="Obesidade (%)" value={assessment.obesityLevel} status="Moderado" />
        <MetricRow icon={Clock} label="Idade metabólica" value={assessment.metabolicAge} />
        <MetricRow icon={User} label="LBM (Kg)" value={assessment.lbm} />
        <MetricRow icon={User} label="Idade real" value={assessment.realAge} />
        <MetricRow icon={TrendingUp} label="Altura (cm)" value={assessment.height} />
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

// 4. NOVA AVALIAÇÃO (Formulário Completo)
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
  const [view, setView] = useState('home'); 
  const [selectedIndex, setSelectedIndex] = useState(assessments.length - 1);

  const handleSave = (data: any) => {
    const newRecord = { ...data, id: Date.now() };
    onSave(newRecord);
    setSelectedIndex(assessments.length);
    setView('home');
  };

  const current = assessments[selectedIndex] || assessments[assessments.length - 1];

  return (
    <div className="fixed inset-0 z-[100] bg-[#FDFEFE] font-sans selection:bg-blue-100 overflow-hidden flex flex-col">
      {/* Header Fixo */}
      <header className="p-6 flex justify-between items-center bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 border-2 border-white shadow-sm hover:bg-slate-200 transition-colors">
            <X size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none">Avaliação Física</h1>
            <p className="text-[9px] font-black text-blue-500 uppercase mt-1">Bioimpedância</p>
          </div>
        </div>
        <div className="flex gap-4 text-slate-400">
          <Monitor size={20} strokeWidth={3} />
          <RefreshCw size={20} strokeWidth={3} />
        </div>
      </header>

      {/* Tabs Superiores (Apenas em Relatórios) */}
      {(view === 'metrics' || view === 'analysis') && (
        <div className="px-6 mb-6">
          <div className="bg-slate-50 p-1.5 rounded-[1.8rem] flex shadow-inner border border-slate-100">
            <button onClick={() => setView('metrics')} className={`flex-1 py-3 text-[10px] font-black rounded-[1.4rem] transition-all uppercase tracking-widest ${view === 'metrics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400'}`}>Métricas</button>
            <button onClick={() => setView('analysis')} className={`flex-1 py-3 text-[10px] font-black rounded-[1.4rem] transition-all uppercase tracking-widest ${view === 'analysis' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400'}`}>Análise</button>
          </div>
        </div>
      )}

      {/* Área de Conteúdo */}
      <main className="px-6 flex-1 overflow-y-auto no-scrollbar pb-32">
        {view === 'home' && <HomeView assessment={assessments[assessments.length-1]} onNavigate={setView} />}
        {view === 'new' && <NewAssessmentForm onSave={handleSave} onCancel={() => setView('home')} />}
        {view === 'metrics' && <MetricsView assessment={current} />}
        {view === 'analysis' && <AnalysisView assessment={current} />}
        {view === 'history' && (
          <div className="space-y-3 pb-32 animate-in fade-in duration-300">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-6">Registros Anteriores</h3>
            {assessments.slice().reverse().map((item, idx) => {
              const actualIdx = assessments.length - 1 - idx;
              return (
                <div key={item.id} 
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
        )}
      </main>

      {/* Dock Inferior */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center py-4 px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[3rem] z-20">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 ${view === 'home' ? 'text-blue-600' : 'text-slate-300'}`}>
          <Home size={24} strokeWidth={view === 'home' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Início</span>
        </button>
        <div className="relative -top-10 scale-125">
          <button onClick={() => setView('new')} className="bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-400 border-4 border-white active:scale-90 transition-transform">
            <Plus size={28} strokeWidth={4} />
          </button>
        </div>
        <button onClick={() => { setSelectedIndex(assessments.length-1); setView('metrics'); }} className={`flex flex-col items-center gap-1.5 ${view === 'metrics' || view === 'analysis' || view === 'history' ? 'text-blue-600' : 'text-slate-300'}`}>
          <BarChart2 size={24} strokeWidth={view !== 'home' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Relatórios</span>
        </button>
      </nav>
    </div>
  );
}
