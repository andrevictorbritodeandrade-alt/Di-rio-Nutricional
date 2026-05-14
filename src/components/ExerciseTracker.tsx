import React, { useState, useRef, useEffect } from 'react';
import { Dumbbell, RefreshCw, Activity, Footprints, Upload } from 'lucide-react';
import { Workout, User } from '../types';
import { analyzeWorkoutScreenshot } from '../services/visionService';
import { connectGoogleFit, fetchTodayWorkouts } from '../services/googleFitService';
import { saveProgressData, subscribeToProgressData } from '../services/firestoreService';

export const initialWorkouts: Workout[] = [
  {
    id: 'workout_2026_04_15_2106',
    date: '15/04/2026',
    activity: 'Corrida',
    duration: '38:18',
    calories: 174,
    details: {
      distanceKm: 3.12,
      averagePace: '12\'14"/km',
      averageHeartRateBpm: 110,
      averageCadencePpm: 104,
      elevationGainMeters: 4,
      advancedMetrics: {
        asymmetry: 'Tendência para o lado Direito (Azul)',
        groundContactTime: 'Alto (Laranja)',
        flightTime: 'Ótimo (Verde)',
        regularity: 'Tendência para o lado Direito (Azul)',
        vertical: 'Médio (Laranja)',
        stiffness: 'Médio (Laranja)'
      },
      performanceAndRecovery: {
        vo2Max: 36.1,
        vo2MaxClassification: 'Ruim (Laranja/Vermelho)',
        estimatedSweatLossMl: 252,
        hydrationRecommendationMl: 378,
        device: 'Galaxy Watch7'
      }
    }
  },
  {
    id: 'workout_2026_04_16_2222',
    date: '16/04/2026',
    activity: 'Caminhada',
    duration: '33:15',
    calories: 195,
    details: {
      distanceKm: 3.52,
      averagePace: '6.3 km/h',
      averageHeartRateBpm: 115,
      averageCadencePpm: 119, // 3967 steps / 33.25 min
      elevationGainMeters: 2,
      performanceAndRecovery: {
        vo2Max: 36.1,
        vo2MaxClassification: 'Bom (Verde)',
        estimatedSweatLossMl: 188,
        hydrationRecommendationMl: 282,
        device: 'Galaxy Watch7'
      }
    }
  },
  {
    id: 'workout_2026_04_19_1210',
    date: '19/04/2026',
    activity: 'Corrida',
    duration: '48:54',
    calories: 223,
    details: {
      distanceKm: 3.74,
      averagePace: '13\'04"/km',
      averageHeartRateBpm: 105,
      averageCadencePpm: 101,
      elevationGainMeters: 32,
      performanceAndRecovery: {
        vo2Max: 36.1,
        vo2MaxClassification: 'Bom (Verde)',
        estimatedSweatLossMl: 317,
        hydrationRecommendationMl: 475,
        device: 'Galaxy Watch7'
      }
    }
  },
  {
    id: 'workout_2026_04_20_1732',
    date: '20/04/2026',
    activity: 'Corrida',
    duration: '46:20',
    calories: 362,
    details: {
      distanceKm: 4.50,
      averagePace: '10\'17"/km',
      averageHeartRateBpm: 131,
      averageCadencePpm: 112,
      elevationGainMeters: 34,
      splits: [
        { distance: '1.00 km', time: '11:42', pace: '11\'42"' },
        { distance: '1.00 km', time: '09:04', pace: '09\'04"' },
        { distance: '1.00 km', time: '09:52', pace: '09\'52"' },
        { distance: '1.00 km', time: '10:12', pace: '10\'12"' },
        { distance: '0.50 km', time: '05:28', pace: '10\'53"' }
      ],
      heartRateZones: [
        { zone: 5, name: 'Máxima', range: '161-178 bpm', usage: 'Mínimo' },
        { zone: 4, name: 'Anaeróbica', range: '143-160 bpm', usage: 'Moderado' },
        { zone: 3, name: 'Aeróbica', range: '125-142 bpm', usage: 'Predominante/Longo' },
        { zone: 2, name: 'Controle de Peso', range: '107-124 bpm', usage: 'Baixo' },
        { zone: 1, name: 'Baixa Intensidade', range: '89-106 bpm', usage: 'Baixo' }
      ],
      advancedMetrics: {
        asymmetry: 'Tendência para o lado Direito (Azul)',
        groundContactTime: 'Alto/Lento (Laranja)',
        flightTime: 'Ótimo (Verde)',
        regularity: 'Tendência para o lado Direito (Azul)',
        vertical: 'Médio (Laranja)',
        stiffness: 'Médio (Laranja)'
      },
      performanceAndRecovery: {
        vo2Max: 36.1,
        vo2MaxClassification: 'Ruim',
        estimatedSweatLossMl: 606,
        hydrationRecommendationMl: 909,
        device: 'Galaxy Watch7'
      }
    }
  }
];

interface ExerciseTrackerProps {
  currentUser?: User;
}

export const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({ currentUser }) => {
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingFit, setIsSyncingFit] = useState(false);
  const [isConnectedToFit, setIsConnectedToFit] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToProgressData(currentUser.id, (cloudData) => {
        if (cloudData && cloudData.workouts) {
          const existingIds = new Set(cloudData.workouts.map((w: any) => w.id));
          const newInitials = initialWorkouts.filter(w => !existingIds.has(w.id));
          setWorkouts([...cloudData.workouts, ...newInitials]);
        } else {
          setWorkouts(initialWorkouts);
        }
        setIsDataLoaded(true);
      });
      return () => unsubscribe();
    } else {
      setIsDataLoaded(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isDataLoaded) {
      saveProgressData(currentUser.id, { workouts }).catch(console.error);
    }
  }, [workouts, currentUser, isDataLoaded]);

  useEffect(() => {
    const token = localStorage.getItem('googleFitToken');
    if (token) {
      setIsConnectedToFit(true);
    }
  }, []);

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
          details: result.details || undefined
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

  const exerciseGoal = 300;
  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
  const exerciseProgress = Math.min(100, (totalCaloriesBurned / exerciseGoal) * 100);

  const getMetricColor = (value: string) => {
    const v = value.toLowerCase();
    if (v.includes('ruim') || v.includes('alto') || v.includes('lento') || v.includes('vermelho')) {
      return 'text-red-700 bg-red-100 border-red-200';
    }
    if (v.includes('médio') || v.includes('moderado') || v.includes('laranja') || v.includes('amarelo')) {
      return 'text-amber-700 bg-amber-100 border-amber-200';
    }
    if (v.includes('ótimo') || v.includes('bom') || v.includes('verde')) {
      return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    }
    if (v.includes('azul')) {
      return 'text-cyan-700 bg-cyan-100 border-cyan-200';
    }
    return 'text-slate-700 bg-slate-100 border-slate-200';
  };

  const getCleanLabel = (str: string) => str.replace(/\(.*\)/, '').trim();

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Exercícios</h2>
      
      {/* META DE EXERCÍCIOS DIÁRIA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider font-montserrat">Meta de Exercício</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diário</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-slate-900 font-montserrat">{totalCaloriesBurned} / {exerciseGoal} kcal</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full ${
                exerciseProgress >= 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
              }`}
              style={{ width: `${exerciseProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {exerciseProgress >= 100 ? 'Meta Atingida! 🔥' : `Faltam ${Math.max(0, exerciseGoal - totalCaloriesBurned)} kcal`}
            </p>
            <p className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
              {Math.round(exerciseProgress)}%
            </p>
          </div>
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
            <div key={w.id} className="bg-stone-50 rounded-lg border border-stone-100 overflow-hidden">
              <div 
                className={`flex justify-between items-center p-3 ${w.details ? 'cursor-pointer hover:bg-stone-100' : ''}`}
                onClick={() => {
                  if (w.details) {
                    setExpandedWorkoutId(expandedWorkoutId === w.id ? null : w.id);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {w.activity.toLowerCase().includes('corrid') || w.activity.toLowerCase().includes('caminhad') ? (
                    <Footprints className="text-blue-500" size={20} />
                  ) : (
                    <Dumbbell className="text-blue-500" size={20} />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{w.activity}</p>
                    <p className="text-[10px] text-slate-500">{w.date} • {w.duration}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-blue-600">{w.calories} kcal</span>
                  {w.details && (
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">
                      {expandedWorkoutId === w.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </span>
                  )}
                </div>
              </div>
              
              {w.details && expandedWorkoutId === w.id && (
                <div className="p-4 bg-white border-t border-stone-100 text-xs text-slate-700 space-y-5">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Ritmo</p>
                      <p className="text-sm font-black text-slate-700">{w.details.averagePace}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">FC Média</p>
                      <p className="text-sm font-black text-slate-700">{w.details.averageHeartRateBpm} <span className="text-[10px] font-medium text-slate-400">bpm</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
