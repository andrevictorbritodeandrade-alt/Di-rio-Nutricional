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
  AlertCircle
} from 'lucide-react';

import { GoogleGenAI } from "@google/genai";

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
  const [activeTab, setActiveTab] = useState<'diario' | 'historico' | 'receitas'>('diario');
  const [isDiaDeTreino, setIsDiaDeTreino] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);
  const [currentDayName, setCurrentDayName] = useState('');
  const [activeMealId, setActiveMealId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const metaPeso = 87;
  const tempoEstimado = "12-16 semanas";
  
  // REGISTO DE ÁGUA ATUALIZADO: 1920ml + 340ml = 2260ml
  const [waterIntake, setWaterIntake] = useState(2260);
  
  // Histórico Real: Café da manhã registrado como Opção C (Fora do Padrão)
  const [confirmedMeals, setConfirmedMeals] = useState<Record<number, MealData>>({
    101: { p: 11, c: 30, g: 9, kcal: 245, option: 'C', realDescription: "Opção C: 1 Pão Francês, Queijo e Mortadela" },
    102: { p: 41, c: 55, g: 35, kcal: 710, option: 'C', realDescription: "Almoço (IA): Peixe Frito (150g), Arroz (100g), Batata Palha (30g), Salada c/ Ovo" },
    103: { p: 15, c: 35, g: 12, kcal: 320, option: 'C', realDescription: "Lanche 17h: Pão Francês (67g), Mortadela Seara, Mussarela, Café c/ Sucralose" }
  });

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

  const CALORIE_GOAL = 1500; 
  const WATER_GOAL = 3000; 

  const rotinaTreino = [
    { id: 1, nome: "Pré-Treino", hora: "05:15", desc: "Café preto + 1 banana", kcal: 90, status: "concluido", target: { p: 2, c: 20, g: 0, kcal: 90 } },
    { id: 101, nome: "Pequeno-almoço", hora: "08:00", desc: "Pão Francês, Queijo e Mortadela", kcal: 245, status: "concluido", target: { p: 11, c: 30, g: 9, kcal: 245 } },
    { id: 102, nome: "Almoço", hora: "12:30", desc: "Frango (150g), Arroz (100g), Batata Palha, Salada e Ovo", kcal: 710, status: "concluido", target: { p: 41, c: 55, g: 35, kcal: 710 } },
    { id: 103, nome: "Lanche", hora: "17:00", desc: "Pão Francês, Mortadela, Muçarela e Café", kcal: 320, status: "concluido", target: { p: 15, c: 35, g: 12, kcal: 320 } },
    { id: 104, nome: "Jantar", hora: "20:00", desc: "Sopa de Legumes batida com Frango", kcal: 175, status: "pendente", target: { p: 20, c: 15, g: 4, kcal: 175 } },
    { id: 105, nome: "Ceia", hora: "22:15", desc: "Iogurte Natural + 10g Whey/Aveia", kcal: 110, status: "pendente", target: { p: 15, c: 10, g: 2, kcal: 110 } },
  ];

  const rotinaDescanso = [
    { id: 201, nome: "Pequeno-almoço", hora: "10:30", desc: "Omelete Francesa (2 ovos) + 1 fatia de Queijo", kcal: 190, status: "pendente", target: { p: 18, c: 2, g: 12, kcal: 190 } },
    { id: 202, nome: "Almoço", hora: "13:30", desc: "Proteína (150g) + Mix de Legumes no vapor + 50g Arroz", kcal: 450, status: "pendente", target: { p: 35, c: 30, g: 15, kcal: 450 } },
    { id: 203, nome: "Lanche", hora: "17:30", desc: "1 Fruta (Maçã/Pera) + 3 Castanhas", kcal: 150, status: "pendente", target: { p: 2, c: 20, g: 8, kcal: 150 } },
    { id: 204, nome: "Jantar", hora: "20:30", desc: "Omelete de 2 ovos + Sopa de Abóbora", kcal: 200, status: "pendente", target: { p: 15, c: 12, g: 10, kcal: 200 } },
    { id: 205, nome: "Ceia", hora: "22:30", desc: "Chá + 2 fatias de Queijo Branco", kcal: 80, status: "pendente", target: { p: 12, c: 1, g: 4, kcal: 80 } },
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
      for (let i = 0; i < schedule.length; i++) {
        const [h, m] = schedule[i].hora.split(':').map(Number);
        const mealTime = h * 60 + m;
        if (totalMinutes >= mealTime) foundId = schedule[i].id;
      }
      setActiveMealId(foundId);
      if (selectedMeal === null) setSelectedMeal(foundId); 
    };
    updateTimeContext();
    const timer = setInterval(updateTimeContext, 60000);
    return () => clearInterval(timer);
  }, [isDiaDeTreino, selectedMeal, cardapioAtual]);

  const confirmChoice = (mealId: number, choice: string, data: any) => {
    setConfirmedMeals(prev => ({ 
      ...prev, 
      [mealId]: { ...data, option: choice, realDescription: `Opção ${choice}: ${data.title}` } 
    }));
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      let prompt = `Você é um assistente de nutrição pessoal para o André. 
      Analise o seguinte comando: "${inputText}".
      Se houver uma imagem, analise os alimentos presentes, estime a gramatura total e por porção.
      Calcule os macronutrientes (P, C, G) e as Calorias.
      Responda de forma curta, direta e motivadora em português.
      Se o comando for para registrar algo, sugira os valores para eu adicionar ao histórico.`;

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
        contents: [{ parts }],
      });

      // For now, we just show the response in an alert or a toast
      // In a real app, we would parse the JSON and update confirmedMeals
      alert(response.text);
      
      setInputText('');
      setSelectedImage(null);
    } catch (error) {
      console.error("Erro ao processar com IA:", error);
      alert("Erro ao processar sua solicitação. Tente novamente.");
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 pb-40 font-sans relative scrollbar-hide">
      {/* HEADER ESTILO MYFITNESSPAL */}
      <header className="bg-white rounded-b-[2.5rem] shadow-sm border-b border-stone-200 p-6 pt-8 sticky top-0 z-50">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat uppercase">Diário Nutricional</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span>{currentDayName || 'Hoje'}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsDiaDeTreino(!isDiaDeTreino)}
              className={`px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
                isDiaDeTreino 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              {isDiaDeTreino ? <Flame className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isDiaDeTreino ? 'DIA DE TREINO' : 'DIA DE DESCANSO'}
            </button>
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
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto space-y-4 pt-4 px-3">
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
                const isConfirmed = confirmedMeals[meal.id];
                return (
                  <div 
                    key={meal.id}
                    onClick={() => setSelectedMeal(selectedMeal === meal.id ? null : meal.id)}
                    className={`bg-white rounded-[2rem] shadow-sm border transition-all active:scale-[0.98] cursor-pointer overflow-hidden ${
                      selectedMeal === meal.id ? 'border-blue-500 ring-4 ring-blue-50' : 'border-stone-200'
                    }`}
                  >
                    <div className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                        isConfirmed ? 'bg-emerald-50 text-emerald-500' : 'bg-stone-50 text-stone-400'
                      }`}>
                        {isConfirmed ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{meal.hora}</p>
                            <h3 className="text-base font-black text-slate-900 font-montserrat">{meal.nome}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 font-montserrat">{isConfirmed ? confirmedMeals[meal.id].kcal : meal.kcal} kcal</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Alvo: {meal.target.kcal}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                          {isConfirmed ? confirmedMeals[meal.id].realDescription : meal.desc}
                        </p>
                      </div>
                    </div>
                    
                    {/* INDICADOR DE STATUS */}
                    <div className={`h-1.5 w-full ${
                      isConfirmed 
                      ? (confirmedMeals[meal.id].option === 'A' ? 'bg-emerald-500' : confirmedMeals[meal.id].option === 'B' ? 'bg-amber-400' : 'bg-red-500')
                      : 'bg-stone-100'
                    }`} />
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
                <button className="w-full py-4 bg-stone-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-t border-stone-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  Marcar como Feito
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
    </div>
  );
};

export default App;
