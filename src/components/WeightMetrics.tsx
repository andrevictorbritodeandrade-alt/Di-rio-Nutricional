import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Target, TrendingDown, Scale } from 'lucide-react';
import { ProgressEntry, User } from '../types';
import { saveProgressData, subscribeToProgressData } from '../services/firestoreService';

export const initialData: ProgressEntry[] = [
  { date: '17/03', weight: 99, muscleMass: 34, bodyFat: 30 },
  { date: '24/03', weight: 100.5, muscleMass: 34.5, bodyFat: 29.8 },
  { date: '31/03', weight: 101.25, muscleMass: 34.8, bodyFat: 29.6 },
  { date: '07/04', weight: 102.2, muscleMass: 35, bodyFat: 29.4 },
  { date: '18/04', weight: 101, muscleMass: 35.5, bodyFat: 28.5 },
  { date: '21/04', weight: 100.8, muscleMass: 35.5, bodyFat: 28.2 },
  { date: '27/04', weight: 100.1, muscleMass: 36.9, bodyFat: 30 },
  { date: '30/04', weight: 100.5, muscleMass: 37, bodyFat: 29.8 },
  { date: '07/05', weight: 100.2, muscleMass: 37.2, bodyFat: 29.5 },
  { date: '09/05', weight: 99.45, muscleMass: 37.5, bodyFat: 29.2 },
  { date: '10/05', weight: 99, muscleMass: 37.8, bodyFat: 29.0 },
  { date: '19/05', weight: 99, muscleMass: 38.0, bodyFat: 28.5 },
];

export const WeightMetrics: React.FC<{ currentUser?: User }> = ({ currentUser }) => {
  const [data, setData] = useState<ProgressEntry[]>(initialData);
  const [newWeight, setNewWeight] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToProgressData(currentUser.id, (cloudData) => {
        if (cloudData && cloudData.data && cloudData.data.length > 0) {
          setData(cloudData.data);
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
      saveProgressData(currentUser.id, { data }).catch(console.error);
    }
  }, [data, currentUser, isDataLoaded]);

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

  const currentWeight = data.length > 0 ? data[data.length - 1].weight : 102;
  const initialWeight = data.length > 0 ? data[0].weight : 103;
  const targetWeight = 87;
  const weightToLose = currentWeight - targetWeight;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Métricas de Peso</h2>
      
      {/* PROJEÇÃO DE METAS */}
      <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter font-montserrat italic">Meta de Peso</h3>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Peso Atual</p>
            <p className="text-3xl font-black font-montserrat tracking-tighter">{currentWeight} <span className="text-sm">kg</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Meta</p>
            <p className="text-2xl font-black font-montserrat">{targetWeight} <span className="text-sm">kg</span></p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Falta</p>
            <p className="text-2xl font-black font-montserrat">{weightToLose > 0 ? weightToLose.toFixed(1) : 0} <span className="text-sm">kg</span></p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 relative z-10">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Tempo Estimado</p>
          <p className="text-lg font-black font-montserrat italic">12-16 semanas</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
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
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="Peso" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}>
                <LabelList dataKey="weight" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#3b82f6' }} />
              </Line>
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
              <Line type="monotone" dataKey="muscleMass" stroke="#10b981" name="Massa Magra" strokeWidth={2} dot={{ r: 4 }}>
                <LabelList dataKey="muscleMass" position="top" offset={10} style={{ fontSize: '8px', fontWeight: 'bold', fill: '#10b981' }} />
              </Line>
              <Line type="monotone" dataKey="bodyFat" stroke="#ef4444" name="Gordura" strokeWidth={2} dot={{ r: 4 }}>
                <LabelList dataKey="bodyFat" position="bottom" offset={10} style={{ fontSize: '8px', fontWeight: 'bold', fill: '#ef4444' }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
