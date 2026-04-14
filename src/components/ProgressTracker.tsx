import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Target, TrendingDown, Upload, Dumbbell, RefreshCw, Activity } from 'lucide-react';
import { ProgressEntry, Workout } from '../types';
import { analyzeWorkoutScreenshot } from '../services/visionService';
import { connectGoogleFit, fetchTodayWorkouts } from '../services/googleFitService';

const initialData: ProgressEntry[] = [
  { date: '17/03', weight: 99, muscleMass: 35, bodyFat: 28 },
  { date: '24/03', weight: 100.5, muscleMass: 35, bodyFat: 28.5 },
  { date: '31/03', weight: 101.2, muscleMass: 35, bodyFat: 29 },
  { date: '07/04', weight: 102, muscleMass: 35, bodyFat: 29.5 },
];

const ProgressTracker: React.FC = () => {
  const [data, setData] = useState<ProgressEntry[]>(initialData);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingFit, setIsSyncingFit] = useState(false);
  const [isConnectedToFit, setIsConnectedToFit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('googleFitToken');
    if (token) {
      setIsConnectedToFit(true);
    }
  }, []);

  const handleAddWeight = () => {
    if (!newWeight) return;
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const newEntry: ProgressEntry = {
      date: today,
      weight: parseFloat(newWeight),
      muscleMass: data[data.length - 1].muscleMass,
      bodyFat: data[data.length - 1].bodyFat,
    };
    setData([...data, newEntry]);
    setNewWeight('');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await analyzeWorkoutScreenshot(file);
      if (result) {
        const newWorkout: Workout = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('pt-BR'),
          activity: result.activity || 'Treino',
          duration: result.duration || '00:00',
          calories: result.calories || 0,
        };
        setWorkouts(prev => [...prev, newWorkout]);
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      alert("Não foi possível ler o print. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncGoogleFit = async () => {
    setIsSyncingFit(true);
    try {
      if (!isConnectedToFit) {
        await connectGoogleFit();
        setIsConnectedToFit(true);
      }
      
      const fitWorkouts = await fetchTodayWorkouts();
      if (fitWorkouts.length > 0) {
        // Mesclar treinos evitando duplicatas pelo ID
        setWorkouts(prev => {
          const existingIds = new Set(prev.map(w => w.id));
          const newWorkouts = fitWorkouts.filter(w => !existingIds.has(w.id));
          return [...prev, ...newWorkouts];
        });
        alert(`${fitWorkouts.length} treino(s) sincronizado(s) com sucesso!`);
      } else {
        alert("Nenhum treino encontrado hoje no Google Fit.");
      }
    } catch (error: any) {
      console.error("Erro ao sincronizar Google Fit:", error);
      if (error.message === "Token expirado") {
        setIsConnectedToFit(false);
        alert("Sua sessão do Google Fit expirou. Por favor, conecte novamente.");
      } else {
        alert("Erro ao sincronizar com Google Fit. Verifique se você concedeu as permissões.");
      }
    } finally {
      setIsSyncingFit(false);
    }
  };

  const currentWeight = data.length > 0 ? data[data.length - 1].weight : 102;
  const targetWeight = 87;
  const weightToLose = currentWeight - targetWeight;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Progresso</h2>
      
      {/* PROJEÇÃO DE METAS */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[2rem] shadow-lg text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-montserrat">Projeção de Metas</h3>
            <p className="text-[10px] font-medium opacity-80">De {currentWeight}kg para {targetWeight}kg</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Faltam perder</span>
              <span className="text-xl font-black">{weightToLose > 0 ? weightToLose.toFixed(1) : 0} kg</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-emerald-400 h-2 rounded-full" 
                style={{ width: `${Math.max(0, Math.min(100, ((102 - currentWeight) / (102 - targetWeight)) * 100))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-4">
            <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Ritmo Saudável (0.5kg/sem)</p>
                <p className="text-sm font-black">{Math.ceil(weightToLose / 0.5)} semanas <span className="text-[10px] font-normal opacity-70">(~{(weightToLose / 0.5 / 4.3).toFixed(1)} meses)</span></p>
              </div>
            </div>
            
            <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-blue-300" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Ritmo Moderado (0.75kg/sem)</p>
                <p className="text-sm font-black">{Math.ceil(weightToLose / 0.75)} semanas <span className="text-[10px] font-normal opacity-70">(~{(weightToLose / 0.75 / 4.3).toFixed(1)} meses)</span></p>
              </div>
            </div>

            <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-amber-300" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Ritmo Intenso (1kg/sem)</p>
                <p className="text-sm font-black">{Math.ceil(weightToLose / 1)} semanas <span className="text-[10px] font-normal opacity-70">(~{(weightToLose / 1 / 4.3).toFixed(1)} meses)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REGISTRO DE PESO */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4">Registrar Peso</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Peso (kg)"
            className="flex-1 p-2 border border-slate-300 rounded-lg"
          />
          <button
            onClick={handleAddWeight}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* REGISTRO DE TREINOS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4">Treinos (Samsung Health / Google Fit)</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleSyncGoogleFit}
            disabled={isSyncingFit}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-sm transition-colors ${
              isConnectedToFit 
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isSyncingFit ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Activity size={18} />
            )}
            {isConnectedToFit ? 'Sincronizar Fit' : 'Conectar Fit'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-stone-100 text-stone-700 p-3 rounded-lg font-semibold text-sm hover:bg-stone-200 transition-colors"
          >
            <Upload size={18} />
            {isProcessing ? 'Lendo...' : 'Print'}
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        
        <div className="space-y-2">
          {workouts.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-4">Nenhum treino registrado hoje.</p>
          )}
          {workouts.map(w => (
            <div key={w.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-100">
              <div className="flex items-center gap-3">
                <Dumbbell className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{w.activity}</p>
                  <p className="text-[10px] text-slate-500">{w.date} • {w.duration}</p>
                </div>
              </div>
              <span className="text-sm font-black text-blue-600">{w.calories} kcal</span>
            </div>
          ))}
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4">Peso (kg)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="Peso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4">Massa Magra vs Gordura (%)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="muscleMass" stroke="#10b981" name="Massa Magra" />
              <Line type="monotone" dataKey="bodyFat" stroke="#ef4444" name="Gordura" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
