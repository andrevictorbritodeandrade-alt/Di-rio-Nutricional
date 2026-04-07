import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  Check, 
  Edit3, 
  ThumbsDown, 
  Star, 
  ChevronDown, 
  GlassWater,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Send,
  History,
  Coffee,
  CheckCircle2,
  ChefHat,
  Flame,
  Utensils,
  Target,
  Calendar,
  AlertCircle,
  LogOut,
  Activity,
  Heart,
  Droplets
} from 'lucide-react';

import { GoogleGenAI, Type } from "@google/genai";
import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Login from './components/Login';
import Anamnesis from './components/Anamnesis';
import { User, DietPlan } from './types';
import { USERS } from './constants';
import { saveDailyLog, subscribeToDailyLog } from './services/firestoreService';

interface MealData {
  p: number;
  c: number;
  g: number;
  kcal: number;
  option: string;
  realDescription: string;
  title?: string;
}

interface Recipe {
  id: number;
  titulo: string;
  tempo: string;
  nivel: string;
  calorias: string;
  ingredientes: string[];
  preparo: string[];
}

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'diario' | 'historico' | 'receitas' | 'saude'>('diario');
  const [isDiaDeTreino, setIsDiaDeTreino] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);
  const [currentDayName, setCurrentDayName] = useState('');
  const [activeMealId, setActiveMealId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const [healthInputType, setHealthInputType] = useState<'glucose' | 'bp' | 'hr' | null>(null);
  const [healthInputValue, setHealthInputValue] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const metaPeso = 87;
  const tempoEstimado = "12-16 semanas";
  
  // REGISTO DE ÁGUA: Começa zerado conforme pedido
  const [waterIntake, setWaterIntake] = useState(0);
  
  // AFERIÇÕES DE SAÚDE
  const [healthMeasurements, setHealthMeasurements] = useState<any[]>([]);
  
  // Começa zerado conforme pedido do usuário
  const [confirmedMeals, setConfirmedMeals] = useState<Record<number, MealData>>({});

  const receitas: Recipe[] = [
    {
      id: 1,
      titulo: "Peito de Frango Grelhado (O Segredo da Suculência)",
      tempo: "20 min",
      nivel: "Fácil",
      calorias: "165 kcal/100g",
      ingredientes: [
        "150g de filé de peito de frango",
        "Sal e pimenta-do-reino a gosto",
        "1 dente de alho amassado",
        "Páprica defumada (essencial para a cor)",
        "Fio de azeite"
      ],
      preparo: [
        "Técnica de Brine: Deixe o frango em água com sal por 10 min antes de grelhar para não secar.",
        "Tempere with alho e páprica. Não use temperos prontos com muito sódio!",
        "Aqueça a frigideira até quase sair fumaça.",
        "Sele o frango por 4 minutos de cada lado sem ficar mexendo. Isso cria a reação de Maillard (aquela crostinha saborosa).",
        "Deixe descansar 2 minutos antes de cortar para os sucos não saírem."
      ]
    },
    {
      id: 2,
      titulo: "Arroz Temperado Master",
      tempo: "25 min",
      nivel: "Fácil",
      calorias: "130 kcal/100g",
      ingredientes: [
        "1 xícara de arroz agulhinha",
        "2 xícaras de água fervendo",
        "Cebola e alho picados finamente",
        "Cenoura ralada (opcional para volume)"
      ],
      preparo: [
        "Refogue a cebola e o alho no azeite até ficarem translúcidos.",
        "Frite o arroz cru por 2 minutos (isso sela o grão e deixa soltinho).",
        "Adicione a água fervente de uma vez e ajuste o sal.",
        "Cozinhe em fogo baixo com a tampa semi-aberta.",
        "Quando a água secar, desligue e tampe por 5 min. Use um garfo para soltar os grãos."
      ]
    },
    {
      id: 3,
      titulo: "Sopa de Legumes com Frango",
      tempo: "40 min",
      nivel: "Médio",
      calorias: "175 kcal/porção",
      ingredientes: ["Chuchu", "Abobrinha", "Cenoura", "Peito de frango desfiado", "Cúrcuma"],
      preparo: [
        "Refogue o frango com cúrcuma (anti-inflamatório).",
        "Adicione os legumes cortados em cubos uniformes para cozimento igual.",
        "Cubra com água e cozinhe até ficarem macios.",
        "Dica Pro: Bata metade dos legumes no liquidificador e volte para a panela para dar cremosidade sem usar creme de leite."
      ]
    }
  ];

  const CALORIE_GOAL = currentUser?.dietPlan?.kcalGoal || 1500; 
  const WATER_GOAL = 3000; 

  const rotinaTreino = currentUser?.dietPlan?.meals || [
    { 
      id: 1, 
      nome: "Pré-Treino", 
      hora: "05:15", 
      desc: "Café preto + 1 banana", 
      kcal: 90, 
      status: "pendente", 
      target: { p: 2, c: 20, g: 0, kcal: 90 },
      options: [
        { id: 'A', title: "Café preto + 1 banana", p: 2, c: 20, g: 0, kcal: 90 },
        { id: 'B', title: "Café preto + 2 fatias de pão integral", p: 6, c: 24, g: 2, kcal: 140 }
      ]
    },
    { 
      id: 101, 
      nome: "Pequeno-almoço", 
      hora: "08:00", 
      desc: "Pão Francês, Queijo e Mortadela", 
      kcal: 245, 
      status: "pendente", 
      target: { p: 11, c: 30, g: 9, kcal: 245 },
      options: [
        { id: 'A', title: "Pão Francês + Queijo + Mortadela", p: 11, c: 30, g: 9, kcal: 245 },
        { id: 'B', title: "Omelete de 2 ovos + 1 fatia de pão", p: 18, c: 15, g: 12, kcal: 240 },
        { id: 'C', title: "Iogurte + Granola + Fruta", p: 12, c: 35, g: 6, kcal: 242 }
      ]
    },
    { 
      id: 102, 
      nome: "Almoço", 
      hora: "12:30", 
      desc: "Frango (150g), Arroz (100g), Batata Palha, Salada e Ovo", 
      kcal: 710, 
      status: "pendente", 
      target: { p: 41, c: 55, g: 35, kcal: 710 },
      options: [
        { id: 'A', title: "Frango + Arroz + Batata Palha + Salada + Ovo", p: 41, c: 55, g: 35, kcal: 710 },
        { id: 'B', title: "Carne Moída + Purê de Batata + Salada", p: 35, c: 45, g: 25, kcal: 545 }
      ]
    },
    { 
      id: 103, 
      nome: "Lanche", 
      hora: "17:00", 
      desc: "Pão Francês, Mortadela, Muçarela e Café", 
      kcal: 320, 
      status: "pendente", 
      target: { p: 15, c: 35, g: 12, kcal: 320 },
      options: [
        { id: 'A', title: "Pão Francês + Mortadela + Muçarela + Café", p: 15, c: 35, g: 12, kcal: 320 },
        { id: 'B', title: "Shake de Proteína + 1 Maçã", p: 25, c: 20, g: 2, kcal: 198 }
      ]
    },
    { 
      id: 104, 
      nome: "Jantar", 
      hora: "20:00", 
      desc: "Sopa de Legumes batida com Frango", 
      kcal: 175, 
      status: "pendente", 
      target: { p: 20, c: 15, g: 4, kcal: 175 },
      options: [
        { id: 'A', title: "Sopa de Legumes com Frango", p: 20, c: 15, g: 4, kcal: 175 },
        { id: 'B', title: "Salada Completa com Atum", p: 25, c: 10, g: 8, kcal: 212 }
      ]
    },
    { 
      id: 105, 
      nome: "Ceia", 
      hora: "22:15", 
      desc: "Iogurte Natural + 10g Whey/Aveia", 
      kcal: 110, 
      status: "pendente", 
      target: { p: 15, c: 10, g: 2, kcal: 110 },
      options: [
        { id: 'A', title: "Iogurte + Whey/Aveia", p: 15, c: 10, g: 2, kcal: 110 },
        { id: 'B', title: "Chá + 2 Castanhas", p: 1, c: 2, g: 6, kcal: 66 }
      ]
    },
  ];

  const rotinaDescanso = currentUser?.dietPlan?.meals || [
    { 
      id: 201, 
      nome: "Pequeno-almoço", 
      hora: "10:30", 
      desc: "Omelete Francesa (2 ovos) + 1 fatia de Queijo", 
      kcal: 190, 
      status: "pendente", 
      target: { p: 18, c: 2, g: 12, kcal: 190 },
      options: [
        { id: 'A', title: "Omelete Francesa (2 ovos) + Queijo", p: 18, c: 2, g: 12, kcal: 190 },
        { id: 'B', title: "2 Ovos Cozidos + 1 Fruta", p: 14, c: 15, g: 10, kcal: 206 }
      ]
    },
    { 
      id: 202, 
      nome: "Almoço", 
      hora: "13:30", 
      desc: "Proteína (150g) + Mix de Legumes no vapor + 50g Arroz", 
      kcal: 450, 
      status: "pendente", 
      target: { p: 35, c: 30, g: 15, kcal: 450 },
      options: [
        { id: 'A', title: "Proteína + Legumes + Arroz (50g)", p: 35, c: 30, g: 15, kcal: 450 },
        { id: 'B', title: "Peixe Grelhado + Batata Doce + Salada", p: 30, c: 35, g: 10, kcal: 350 }
      ]
    },
    { 
      id: 203, 
      nome: "Lanche", 
      hora: "17:30", 
      desc: "1 Fruta (Maçã/Pera) + 3 Castanhas", 
      kcal: 150, 
      status: "pendente", 
      target: { p: 2, c: 20, g: 8, kcal: 150 },
      options: [
        { id: 'A', title: "1 Fruta + 3 Castanhas", p: 2, c: 20, g: 8, kcal: 150 },
        { id: 'B', title: "Iogurte Grego Zero", p: 10, c: 5, g: 0, kcal: 60 }
      ]
    },
    { 
      id: 204, 
      nome: "Jantar", 
      hora: "20:30", 
      desc: "Omelete de 2 ovos + Sopa de Abóbora", 
      kcal: 200, 
      status: "pendente", 
      target: { p: 15, c: 12, g: 10, kcal: 200 },
      options: [
        { id: 'A', title: "Omelete (2 ovos) + Sopa de Abóbora", p: 15, c: 12, g: 10, kcal: 200 },
        { id: 'B', title: "Caldo de Kenga (Frango e Mandioca)", p: 20, c: 25, g: 8, kcal: 252 }
      ]
    },
    { 
      id: 205, 
      nome: "Ceia", 
      hora: "22:30", 
      desc: "Chá + 2 fatias de Queijo Branco", 
      kcal: 80, 
      status: "pendente", 
      target: { p: 12, c: 1, g: 4, kcal: 80 },
      options: [
        { id: 'A', title: "Chá + 2 fatias de Queijo Branco", p: 12, c: 1, g: 4, kcal: 80 },
        { id: 'B', title: "Leite Desnatado Morno", p: 6, c: 9, g: 0, kcal: 60 }
      ]
    },
  ];

  const cardapioAtual = isDiaDeTreino ? rotinaTreino : rotinaDescanso;

  useEffect(() => {
    const updateTimeContext = () => {
      const days = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
      ];
      const now = new Date();
      const currentDay = days[now.getDay()];
      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      
      setCurrentDayName(currentDay);

      const schedule = cardapioAtual;
      let foundId = schedule[0].id;
      let nextId = null;
      
      for (let i = 0; i < schedule.length; i++) {
        const [h, m] = schedule[i].hora.split(':').map(Number);
        const mealTime = h * 60 + m;
        
        if (totalMinutes >= mealTime) {
          foundId = schedule[i].id;
        }
        
        // Destaque para refeição próxima (faltando 30 minutos)
        if (mealTime > totalMinutes && mealTime <= totalMinutes + 30) {
          nextId = schedule[i].id;
        }
      }
      
      setActiveMealId(nextId || foundId);
      if (selectedMeal === null) setSelectedMeal(nextId || foundId); 
    };
    updateTimeContext();
    const timer = setInterval(updateTimeContext, 60000);
    return () => clearInterval(timer);
  }, [isDiaDeTreino, selectedMeal, cardapioAtual]);

  useEffect(() => {
    if (currentUser) {
      const today = new Date().toISOString().split('T')[0];
      const unsubscribe = subscribeToDailyLog(currentUser.id, today, (data) => {
        if (data.confirmedMeals) setConfirmedMeals(data.confirmedMeals);
        if (data.waterIntake !== undefined) setWaterIntake(data.waterIntake);
        if (data.healthMeasurements) setHealthMeasurements(data.healthMeasurements);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const saveToCloud = async () => {
        setIsSyncing(true);
        const today = new Date().toISOString().split('T')[0];
        try {
          await saveDailyLog(currentUser.id, today, { confirmedMeals, waterIntake, healthMeasurements });
        } catch (error) {
          console.error('Error syncing to cloud:', error);
        } finally {
          setIsSyncing(false);
        }
      };
      saveToCloud();
    }
  }, [confirmedMeals, waterIntake, healthMeasurements, currentUser]);

  const confirmChoice = (mealId: number, choice: string, data: any) => {
    setConfirmedMeals(prev => ({ 
      ...prev, 
      [mealId]: { ...data, option: choice, realDescription: `Opção ${choice}: ${data.title}` } 
    }));
  };

  const getPeriod = (hour: number) => {
    if (hour >= 5 && hour < 12) return 'Manhã';
    if (hour >= 12 && hour < 18) return 'Tarde';
    return 'Noite';
  };

  const addHealthMeasurement = (type: 'glucose' | 'bp' | 'hr', value: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const period = getPeriod(now.getHours());
    const dateStr = now.toISOString().split('T')[0];
    
    const newMeasure = {
      id: Date.now(),
      type,
      value,
      time: timeStr,
      period,
      date: dateStr,
      timestamp: now.getTime()
    };
    
    setHealthMeasurements(prev => [...prev, newMeasure]);
    setShowHealthMenu(false);
  };

  const addWater = (amount: number) => {
    setWaterIntake(prev => prev + amount);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText && !selectedImage) return;

    setIsProcessing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key não configurada. Verifique as variáveis de ambiente.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      let prompt = `Você é um assistente de nutrição pessoal para o(a) ${currentUser?.name}. 
      Analise o seguinte comando: "${inputText}".
      
      REGRAS PARA REGISTRO EM LOTE:
      - Se o usuário relatar várias refeições (ex: "comi café da manhã e almoço"), identifique cada uma.
      - Retorne uma lista de registros no campo 'bulkMeals'.
      - Para cada refeição identificada, tente associar ao ID correto do plano alimentar:
        IDs: ${JSON.stringify(cardapioAtual.map(m => ({ id: m.id, nome: m.nome })))}
      
      Se houver uma imagem, analise os alimentos presentes, estime a gramatura total e por porção.
      Calcule os macronutrientes (P, C, G) e as Calorias.
      Responda em JSON com uma mensagem motivadora e os dados nutricionais se for um registro de refeição.
      Se for apenas uma dúvida, responda apenas a mensagem.
      Se for registro de água (ex: "bebi 500ml"), retorne o campo 'waterAmount' com o valor em ml.
      Se for registro de saúde (ex: "glicemia 110, pressão 12/8, FC 70"), retorne o campo 'healthData' com os campos 'glucose', 'bloodPressure' e 'heartRate'.`;

      const parts: any[] = [{ text: prompt }];
      if (selectedImage) {
        parts.push({
          inlineData: {
            data: selectedImage.split(',')[1],
            mimeType: "image/jpeg"
          }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              waterAmount: { type: Type.NUMBER },
              bulkMeals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mealId: { type: Type.NUMBER },
                    p: { type: Type.NUMBER },
                    c: { type: Type.NUMBER },
                    g: { type: Type.NUMBER },
                    kcal: { type: Type.NUMBER },
                    title: { type: Type.STRING }
                  }
                }
              },
              mealData: {
                type: Type.OBJECT,
                properties: {
                  p: { type: Type.NUMBER },
                  c: { type: Type.NUMBER },
                  g: { type: Type.NUMBER },
                  kcal: { type: Type.NUMBER },
                  title: { type: Type.STRING }
                }
              },
              healthData: {
                type: Type.OBJECT,
                properties: {
                  glucose: { type: Type.STRING },
                  bloodPressure: { type: Type.STRING },
                  heartRate: { type: Type.STRING }
                }
              }
            },
            required: ["message"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result.waterAmount) {
        setWaterIntake(prev => prev + result.waterAmount);
      }

      if (result.healthData) {
        const { glucose, bloodPressure, heartRate } = result.healthData;
        if (glucose && glucose !== '-') addHealthMeasurement('glucose', glucose);
        if (bloodPressure && bloodPressure !== '-') addHealthMeasurement('bp', bloodPressure);
        if (heartRate && heartRate !== '-') addHealthMeasurement('hr', heartRate);
      }

      if (result.bulkMeals && result.bulkMeals.length > 0) {
        setConfirmedMeals(prev => {
          const next = { ...prev };
          result.bulkMeals.forEach((m: any) => {
            const id = m.mealId || Date.now() + Math.random();
            next[id] = {
              p: m.p,
              c: m.c,
              g: m.g,
              kcal: m.kcal,
              option: 'IA',
              realDescription: `Registro IA: ${m.title}`
            };
          });
          return next;
        });
      } else if (result.mealData) {
        const newId = Date.now();
        setConfirmedMeals(prev => ({
          ...prev,
          [newId]: {
            ...result.mealData,
            option: 'IA',
            realDescription: `Registro IA: ${result.mealData.title || inputText}`
          }
        }));
      }

      alert(result.message);
      
      setInputText('');
      setSelectedImage(null);
    } catch (error: any) {
      console.error("Erro detalhado da IA:", error);
      const errorMsg = error.message || "Erro desconhecido";
      alert(`Erro ao processar: ${errorMsg}. Verifique sua conexão ou chave de API.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleMealFed = (meal: any) => {
    const isConfirmed = !!confirmedMeals[meal.id];
    
    if (isConfirmed) {
      const newConfirmed = { ...confirmedMeals };
      delete newConfirmed[meal.id];
      setConfirmedMeals(newConfirmed);
    } else {
      setConfirmedMeals(prev => ({
        ...prev,
        [meal.id]: {
          p: meal.target.p,
          c: meal.target.c,
          g: meal.target.g,
          kcal: meal.target.kcal,
          option: 'A',
          realDescription: `Consumido: ${meal.nome} (${meal.desc})`
        }
      }));
    }
  };

  const totalMacros = (Object.values(confirmedMeals) as MealData[]).reduce((acc, curr) => ({
    p: acc.p + (curr.p || 0), 
    c: acc.c + (curr.c || 0), 
    g: acc.g + (curr.g || 0), 
    kcal: acc.kcal + (curr.kcal || 0)
  }), { p: 0, c: 0, g: 0, kcal: 0 });

  const totalKcal = totalMacros.kcal;
  const remainingKcal = CALORIE_GOAL - totalKcal;

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  if (!currentUser.anamnesisCompleted) {
    return (
      <Anamnesis 
        user={currentUser} 
        onComplete={(plan) => {
          setCurrentUser({ ...currentUser, anamnesisCompleted: true, dietPlan: plan });
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 pb-40 font-sans relative scrollbar-hide">
      {/* HEADER ESTILO MYFITNESSPAL */}
      <header className="bg-white rounded-b-[2.5rem] shadow-sm border-b border-stone-200 p-6 pt-8 sticky top-0 z-50">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-stone-100">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-black">
                    {currentUser.name[0]}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat uppercase">Diário Nutricional</h1>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{currentDayName || 'Hoje'} • {currentUser.name}</span>
                  {isSyncing && <span className="text-[10px] text-amber-500 font-bold uppercase">Sincronizando...</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentUser(null)}
                className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 active:scale-95 transition-transform"
              >
                <LogOut size={18} />
              </button>
              <button 
                onClick={() => setIsDiaDeTreino(!isDiaDeTreino)}
                className={`px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
                  isDiaDeTreino 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                {isDiaDeTreino ? <Flame className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isDiaDeTreino ? 'TREINO' : 'DESCANSO'}
              </button>
            </div>
          </div>

          {/* RESUMO DE CALORIAS (MYFITNESSPAL STYLE) */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Meta</div>
                <div className="text-xl font-black font-montserrat">{CALORIE_GOAL}</div>
              </div>
              <div className="text-slate-600 font-light text-xl">-</div>
              <div className="text-center">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Alimento</div>
                <div className="text-xl font-black font-montserrat">{totalKcal}</div>
              </div>
              <div className="text-slate-600 font-light text-xl">+</div>
              <div className="text-center">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Exercício</div>
                <div className="text-xl font-black font-montserrat">0</div>
              </div>
              <div className="text-slate-600 font-light text-xl">=</div>
              <div className="text-center">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Restante</div>
                <div className={`text-2xl font-black font-montserrat ${remainingKcal < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {remainingKcal}
                </div>
              </div>
            </div>

            {/* BARRAS DE MACROS */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-slate-400">Carbs</span>
                  <span className="text-white">{totalMacros.c}g</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((totalMacros.c / 150) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-slate-400">Prot</span>
                  <span className="text-white">{totalMacros.p}g</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((totalMacros.p / 120) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-slate-400">Gord</span>
                  <span className="text-white">{totalMacros.g}g</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((totalMacros.g / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TABS NAVEGAÇÃO */}
          <div className="flex bg-stone-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('diario')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                activeTab === 'diario' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> DIÁRIO
            </button>
            <button 
              onClick={() => setActiveTab('historico')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                activeTab === 'historico' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <History className="w-3.5 h-3.5" /> HISTÓRICO
            </button>
            <button 
              onClick={() => setActiveTab('receitas')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                activeTab === 'receitas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" /> RECEITAS
            </button>
            <button 
              onClick={() => setActiveTab('saude')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                activeTab === 'saude' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> SAÚDE
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto space-y-4 pt-4 px-3">
        {activeTab === 'saude' && (
          <div className="space-y-6 pb-24">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 font-montserrat">Mapa de Saúde</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acompanhamento Galaxy Watch 7</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês Atual</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
                </div>
              </div>

              {/* GRÁFICO DE GLICEMIA */}
              <div className="mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Glicemia</h3>
                    <p className="text-lg font-black text-slate-900 font-montserrat flex items-center gap-2">
                      <Droplets className="text-blue-500" size={20} /> {healthMeasurements.filter(m => m.type === 'glucose').slice(-1)[0]?.value || '--'} <span className="text-[10px] text-slate-400">mg/dL</span>
                    </p>
                  </div>
                  <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Estável
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthMeasurements.filter(m => {
                      const d = new Date(m.timestamp);
                      return m.type === 'glucose' && d.getMonth() === new Date().getMonth();
                    })}>
                      <defs>
                        <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGlucose)" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRÁFICO DE FC EM REPOUSO */}
              <div className="mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">FC Repouso</h3>
                    <p className="text-lg font-black text-slate-900 font-montserrat flex items-center gap-2">
                      <Heart className="text-red-500" size={20} /> {healthMeasurements.filter(m => m.type === 'hr').slice(-1)[0]?.value || '--'} <span className="text-[10px] text-slate-400">bpm</span>
                    </p>
                  </div>
                  <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Normal
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthMeasurements.filter(m => {
                      const d = new Date(m.timestamp);
                      return m.type === 'hr' && d.getMonth() === new Date().getMonth();
                    })}>
                      <defs>
                        <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#colorHR)" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRÁFICO DE PRESSÃO ARTERIAL */}
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pressão Arterial</h3>
                    <p className="text-lg font-black text-slate-900 font-montserrat flex items-center gap-2">
                      <Activity className="text-emerald-500" size={20} /> {healthMeasurements.filter(m => m.type === 'bp').slice(-1)[0]?.value || '--'}
                    </p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Ideal
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthMeasurements.filter(m => {
                      const d = new Date(m.timestamp);
                      return m.type === 'bp' && d.getMonth() === new Date().getMonth();
                    }).map(m => {
                      const [sys, dia] = m.value.split('/').map(Number);
                      return { ...m, sys, dia };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line type="monotone" dataKey="sys" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                      <Line type="monotone" dataKey="dia" stroke="#34d399" strokeWidth={4} dot={{ r: 5, fill: '#34d399', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* LISTA DETALHADA POR PERÍODO */}
            <div className="space-y-4">
              {['Manhã', 'Tarde', 'Noite'].map(period => {
                const measures = healthMeasurements.filter(m => m.period === period);
                if (measures.length === 0) return null;
                return (
                  <div key={period} className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-200">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{period}</h3>
                    <div className="space-y-3">
                      {measures.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400">{m.time}</span>
                            <div className="flex items-center gap-2">
                              {m.type === 'glucose' && <Droplets size={14} className="text-blue-500" />}
                              {m.type === 'bp' && <Activity size={14} className="text-emerald-500" />}
                              {m.type === 'hr' && <Heart size={14} className="text-red-500" />}
                              <span className="text-sm font-black text-slate-900">{m.value}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {m.type === 'glucose' ? 'mg/dL' : m.type === 'hr' ? 'bpm' : ''}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setHealthMeasurements(prev => prev.filter(item => item.id !== m.id))}
                            className="text-stone-300 hover:text-red-400"
                          >
                            <Plus size={14} className="rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'diario' && (
          <>
            {/* CARD DE INSTALAÇÃO DO APP */}
            <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider font-montserrat">Instalar Aplicativo</h3>
                  <p className="text-[10px] font-medium opacity-80">Acesse o Diário Nutricional direto da sua tela inicial</p>
                </div>
              </div>
              <button 
                onClick={() => alert('Para instalar: Clique no ícone de compartilhar do seu navegador e selecione "Adicionar à Tela de Início"')}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                Instalar
              </button>
            </div>

            {/* CARD DE META DE PESO */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta de Peso</p>
                  <p className="text-lg font-black text-slate-900 font-montserrat">{metaPeso} kg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Estimado</p>
                <p className="text-sm font-bold text-emerald-600">{tempoEstimado}</p>
              </div>
            </div>

            {/* SEÇÃO DE AFERIÇÕES DE SAÚDE */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider font-montserrat">Aferições de Saúde</h3>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowHealthMenu(!showHealthMenu)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      showHealthMenu ? 'bg-red-500 text-white rotate-45' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    <Plus size={16} />
                  </button>
                  
                  {showHealthMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-100 p-3 z-[100]"
                    >
                      {!healthInputType ? (
                        <div className="space-y-1">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHealthInputType('glucose');
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors text-left"
                          >
                            <Droplets size={18} className="text-blue-500" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Glicemia</span>
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHealthInputType('bp');
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 rounded-xl transition-colors text-left"
                          >
                            <Activity size={18} className="text-emerald-500" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Pressão</span>
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHealthInputType('hr');
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-left"
                          >
                            <Heart size={18} className="text-red-500" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">FC Repouso</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            {healthInputType === 'glucose' && <Droplets size={14} className="text-blue-500" />}
                            {healthInputType === 'bp' && <Activity size={14} className="text-emerald-500" />}
                            {healthInputType === 'hr' && <Heart size={14} className="text-red-500" />}
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {healthInputType === 'glucose' ? 'Glicemia (mg/dL)' : 
                               healthInputType === 'bp' ? 'Pressão (ex: 12/8)' : 'FC (bpm)'}
                            </span>
                          </div>
                          <input 
                            autoFocus
                            type="text"
                            value={healthInputValue}
                            onChange={(e) => setHealthInputValue(e.target.value)}
                            placeholder="Digite o valor..."
                            className="w-full bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-300"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && healthInputValue) {
                                addHealthMeasurement(healthInputType, healthInputValue);
                                setHealthInputType(null);
                                setHealthInputValue('');
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setHealthInputType(null);
                                setHealthInputValue('');
                              }}
                              className="flex-1 py-2 rounded-lg bg-stone-100 text-[10px] font-black text-stone-500 uppercase tracking-widest"
                            >
                              Voltar
                            </button>
                            <button 
                              disabled={!healthInputValue}
                              onClick={() => {
                                if (healthInputValue) {
                                  addHealthMeasurement(healthInputType, healthInputValue);
                                  setHealthInputType(null);
                                  setHealthInputValue('');
                                }
                              }}
                              className="flex-1 py-2 rounded-lg bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-50"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {healthMeasurements.filter(m => m.date === new Date().toISOString().split('T')[0]).length === 0 ? (
                <p className="text-[10px] text-stone-400 font-medium text-center py-2">Nenhuma aferição registrada hoje.</p>
              ) : (
                <div className="space-y-3">
                  {healthMeasurements
                    .filter(m => m.date === new Date().toISOString().split('T')[0])
                    .slice(-3) // Mostrar as últimas 3 no diário
                    .map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400">{m.time}</span>
                        <div className="flex items-center gap-2">
                          {m.type === 'glucose' && <Droplets size={12} className="text-blue-500" />}
                          {m.type === 'bp' && <Activity size={12} className="text-emerald-500" />}
                          {m.type === 'hr' && <Heart size={12} className="text-red-500" />}
                          <span className="text-[10px] font-bold text-slate-700">{m.value}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase">{m.period}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setHealthMeasurements(prev => prev.filter(item => item.id !== m.id))}
                        className="text-stone-300 hover:text-red-400"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                    </div>
                  ))}
                  {healthMeasurements.filter(m => m.date === new Date().toISOString().split('T')[0]).length > 3 && (
                    <button 
                      onClick={() => setActiveTab('saude')}
                      className="w-full text-center text-[10px] font-black text-blue-500 uppercase tracking-widest pt-2"
                    >
                      Ver todas as aferições
                    </button>
                  )}
                </div>
              )}
              <p className="text-[9px] text-stone-400 font-medium mt-3 italic text-center">
                Dica: Você também pode registrar via comando de voz ou texto!
              </p>
            </div>

            {/* CARD DE ALERTA PSICOLÓGICO */}
            {confirmedMeals[101] && confirmedMeals[101].option === 'C' && (
              <div className="bg-amber-50 border-l-4 border-yellow-400 p-4 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                <p className="text-xs font-medium text-amber-900 leading-relaxed">
                  Atenção: A mortadela do café superou a meta de sódio. Beba água para filtrar o excesso!
                </p>
              </div>
            )}

            {/* LISTA DE REFEIÇÕES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Plano Alimentar</h2>
                <span className="text-[10px] font-bold text-slate-400">{cardapioAtual.length} Refeições</span>
              </div>
              
              {cardapioAtual.map((meal) => {
                const isConfirmed = !!confirmedMeals[meal.id];
                return (
                  <div 
                    key={meal.id}
                    className={`bg-white rounded-[2rem] shadow-sm border transition-all overflow-hidden ${
                      isConfirmed ? 'border-emerald-200 bg-emerald-50/10' : 'border-stone-200'
                    }`}
                  >
                    <div className="p-5 flex items-center gap-4">
                      <button 
                        onClick={() => handleToggleMealFed(meal)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                          isConfirmed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-stone-50 text-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {isConfirmed ? <CheckCircle2 className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                      </button>
                      <div className="flex-1" onClick={() => setSelectedMeal(selectedMeal === meal.id ? null : meal.id)}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{meal.hora}</p>
                              <h3 className="text-base font-black text-slate-900 font-montserrat">{meal.nome}</h3>
                            </div>
                            {activeMealId === meal.id && (
                              <div className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase animate-pulse">
                                Próxima
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 font-montserrat">{isConfirmed && confirmedMeals[meal.id] ? confirmedMeals[meal.id].kcal : meal.kcal} kcal</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Alvo: {meal.target.kcal}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                          {isConfirmed && confirmedMeals[meal.id] ? confirmedMeals[meal.id].realDescription : meal.desc}
                        </p>
                      </div>
                    </div>
                    
                    {/* INDICADOR DE STATUS */}
                    <div className={`h-1.5 w-full ${
                      isConfirmed && confirmedMeals[meal.id]
                      ? (confirmedMeals[meal.id].option === 'A' ? 'bg-emerald-500' : confirmedMeals[meal.id].option === 'B' ? 'bg-amber-400' : 'bg-blue-500')
                      : 'bg-stone-100'
                    }`} />

                    {selectedMeal === meal.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="px-5 pb-5 pt-2 border-t border-stone-50 bg-stone-50/30"
                      >
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-white rounded-2xl border border-stone-100 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Proteína</p>
                            <p className="text-sm font-black text-slate-900">{isConfirmed && confirmedMeals[meal.id] ? confirmedMeals[meal.id].p : meal.target.p}g</p>
                          </div>
                          <div className="text-center p-3 bg-white rounded-2xl border border-stone-100 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Carbo</p>
                            <p className="text-sm font-black text-slate-900">{isConfirmed && confirmedMeals[meal.id] ? confirmedMeals[meal.id].c : meal.target.c}g</p>
                          </div>
                          <div className="text-center p-3 bg-white rounded-2xl border border-stone-100 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Gordura</p>
                            <p className="text-sm font-black text-slate-900">{isConfirmed && confirmedMeals[meal.id] ? confirmedMeals[meal.id].g : meal.target.g}g</p>
                          </div>
                        </div>

                        {!isConfirmed && meal.options && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Escolha uma opção:</p>
                            {meal.options.map((opt: any) => (
                              <button
                                key={opt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmChoice(meal.id, opt.id, opt);
                                }}
                                className="w-full p-4 bg-white border border-stone-200 rounded-2xl text-left hover:border-emerald-300 transition-all active:scale-[0.98]"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Opção {opt.id}</span>
                                  <span className="text-[10px] font-black text-emerald-600">{opt.kcal} kcal</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-tight">{opt.title}</p>
                              </button>
                            ))}
                          </div>
                        )}

                        {!isConfirmed && !meal.options && (
                          <button 
                            onClick={() => handleToggleMealFed(meal)}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                          >
                            Dar Baixa (Alimentado)
                          </button>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* WATER TRACKER (ATUALIZADO) */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                    <GlassWater className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 font-montserrat">Hidratação</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta: {WATER_GOAL}ml</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-600 font-montserrat">{waterIntake}ml</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Faltam {Math.max(0, WATER_GOAL - waterIntake)}ml</p>
                </div>
              </div>
              
              <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden mb-8">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  style={{ width: `${Math.min((waterIntake / WATER_GOAL) * 100, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[250, 340, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setWaterIntake(prev => prev + amount)}
                    className="py-4 bg-stone-50 hover:bg-blue-50 border border-stone-100 hover:border-blue-200 rounded-2xl text-slate-600 hover:text-blue-600 transition-all active:scale-95 flex flex-col items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-black font-montserrat">{amount}ml</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CARD CRÍTICO (VERMELHO) */}
            <div className="bg-red-500 p-6 rounded-[2.5rem] text-white shadow-lg shadow-red-200">
              <div className="flex gap-4 items-center">
                <div className="bg-white/20 p-3 rounded-2xl text-white">
                  <ThumbsDown size={24} />
                </div>
                <p className="text-xs font-black uppercase leading-relaxed tracking-wider">
                  Sódio e carnes processadas causam odores fortes. A hidratação é sua única defesa!
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'historico' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumo da Semana</h2>
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex justify-between items-end h-32 gap-2">
                {[45, 70, 85, 60, 95, 40, 30].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 ${i === 6 ? 'bg-blue-500' : 'bg-stone-100'}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Últimos Registros</h2>
              <div className="space-y-6">
                {(Object.entries(confirmedMeals) as [string, MealData][]).reverse().map(([id, meal]) => (
                  <div key={id} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      meal.option === 'A' ? 'bg-emerald-50 text-emerald-500' : 
                      meal.option === 'B' ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
                    }`}>
                      {meal.option === 'A' ? <CheckCircle2 className="w-5 h-5" /> : 
                       meal.option === 'B' ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 border-b border-stone-100 pb-4">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-black text-slate-900 font-montserrat">{meal.realDescription}</p>
                        <p className="text-sm font-black text-slate-900 font-montserrat">{meal.kcal} kcal</p>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoje • Opção {meal.option}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receitas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Livro de Receitas Master Chef</h2>
              <ChefHat className="w-4 h-4 text-slate-400" />
            </div>

            {receitas.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-black text-slate-900 font-montserrat leading-tight max-w-[70%]">
                      {recipe.titulo}
                    </h3>
                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {recipe.calorias}
                    </div>
                  </div>

                  <div className="flex gap-4 mb-8">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{recipe.tempo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Flame className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{recipe.nivel}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Utensils className="w-3 h-3" /> Ingredientes
                      </h4>
                      <ul className="grid grid-cols-1 gap-2">
                        {recipe.ingredientes.map((ing, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm text-slate-600 font-medium bg-stone-50 p-3 rounded-xl">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Modo de Preparo
                      </h4>
                      <div className="space-y-4">
                        {recipe.preparo.map((step, idx) => (
                          <div key={idx} className="flex gap-4">
                            <span className="text-lg font-black text-stone-200 font-montserrat leading-none">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const newId = Date.now();
                    setConfirmedMeals(prev => ({
                      ...prev,
                      [newId]: {
                        p: parseInt(recipe.calorias) / 20, // Rough estimate for demo
                        c: parseInt(recipe.calorias) / 15,
                        g: parseInt(recipe.calorias) / 40,
                        kcal: parseInt(recipe.calorias),
                        option: 'A',
                        realDescription: `Receita: ${recipe.titulo}`
                      }
                    }));
                    alert(`${recipe.titulo} adicionado ao seu diário!`);
                  }}
                  className="w-full py-4 bg-stone-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-t border-stone-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                >
                  Marcar como Feito (Adicionar ao Diário)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Chat Style Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-[60]">
        <div className="max-w-xl mx-auto p-4">
          {selectedImage && (
            <div className="mb-3 relative w-20 h-20">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-2xl border border-stone-200" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
              >
                <Plus size={12} className="rotate-45" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 border border-stone-200 active:scale-95 transition-transform"
            >
              <Plus size={22} />
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder={isProcessing ? "IA analisando..." : "Registar refeição ou água..."}
                value={inputText}
                disabled={isProcessing}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full h-11 pl-4 pr-12 rounded-full border border-stone-300 focus:ring-2 focus:ring-blue-600 bg-stone-50 text-sm font-medium disabled:opacity-50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isProcessing}
                className="absolute right-1 top-1 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-stone-400 border-t border-stone-100 pt-2">
            <p>Desenvolvido por: André Victor Brito de Andrade</p>
            <p>Contato: andrevictorbritodeandrade@gmail.com</p>
            <p className="text-blue-600">Versão 1.0.0</p>
          </div>
        </div>
      </div>
      <footer className="w-full text-center p-4 text-[10px] text-stone-400 font-medium uppercase tracking-widest bg-stone-50 border-t border-stone-100">
        © {new Date().getFullYear()} Todos os direitos registrados estão com André Victor Brito de Andrade
      </footer>
    </div>
  );
};

export default App;
