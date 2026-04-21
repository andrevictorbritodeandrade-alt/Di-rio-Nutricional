import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { User, Message, DietPlan } from '../types';
import { Send, Loader2, User as UserIcon, ChefHat, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnamnesisProps {
  user: User;
  onComplete: (dietPlan: DietPlan) => void;
}

const Anamnesis: React.FC<AnamnesisProps> = ({ user, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startInterview = async () => {
      const systemInstruction = `Você é um Nutricionista IA especializado em anamnese e avaliação física. 
      Seu objetivo é entrevistar o usuário para criar um plano alimentar personalizado.
      
      Contexto do Usuário:
      Nome: ${user.name}
      ${user.isAutistic ? 'Autista' : ''}
      ${user.hasADHD ? 'TDAH' : ''}
      
      Diretrizes:
      1. Seja acolhedor e profissional.
      2. Pergunte sobre: Peso atual, altura, idade, nível de atividade física, objetivos (perda de peso, ganho de massa, etc.) e restrições alimentares.
      3. IMPORTANTE: Para usuários com TDAH/Autismo (como André), planos longos são desgastantes. Sugira períodos mais curtos (ex: 2 a 4 semanas) para troca de plano para manter o engajamento.
      4. Quando tiver informações suficientes, gere um plano alimentar estruturado em JSON.
      
      Fluxo:
      - Comece se apresentando e perguntando os dados básicos.
      - Faça uma pergunta por vez para não sobrecarregar.
      - No final, diga que está gerando o plano.`;

      const initialMessage = `Olá ${user.name}! Sou seu Nutricionista IA. Vamos começar sua avaliação para criar seu novo plano alimentar. Qual seu peso atual, altura e idade?`;
      
      setMessages([
        { role: 'system', text: systemInstruction },
        { role: 'model', text: initialMessage }
      ]);
    };

    startInterview();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsProcessing(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("API Key do Gemini não encontrada na Anamnese. Configure a variável GEMINI_API_KEY.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: messages[0].text,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: "Sua resposta para o usuário" },
              isFinished: { type: Type.BOOLEAN, description: "Verdadeiro se a anamnese acabou e o plano está pronto" },
              dietPlan: {
                type: Type.OBJECT,
                description: "O plano alimentar gerado",
                properties: {
                  kcalGoal: { type: Type.NUMBER },
                  durationWeeks: { type: Type.NUMBER },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      p: { type: Type.NUMBER },
                      c: { type: Type.NUMBER },
                      g: { type: Type.NUMBER }
                    }
                  },
                  meals: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, kcal: { type: Type.NUMBER } } } }
                }
              }
            },
            required: ["reply", "isFinished"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      
      if (data.isFinished && data.dietPlan) {
        setIsFinished(true);
        setTimeout(() => onComplete(data.dietPlan), 3000);
      }
    } catch (err) {
      console.error("Error in anamnesis:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um problema técnico. Pode repetir?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <header className="bg-white p-6 border-b border-stone-200 flex items-center gap-4 sticky top-0 z-10">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <ChefHat size={24} />
        </div>
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight font-montserrat">Nutricionista IA</h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Avaliação em Curso</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
              msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-stone-100'
            }`}>
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-stone-100 shadow-sm">
              <Loader2 className="animate-spin text-blue-600" size={20} />
            </div>
          </div>
        )}
        {isFinished && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-500 text-white p-6 rounded-[2.5rem] flex flex-col items-center gap-3 text-center shadow-xl shadow-green-100"
          >
            <CheckCircle2 size={40} />
            <h3 className="font-black uppercase tracking-widest text-sm">Plano Gerado com Sucesso!</h3>
            <p className="text-xs font-medium opacity-90">Redirecionando para seu novo diário...</p>
          </motion.div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-stone-100">
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Responda ao nutricionista..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing || isFinished}
            className="w-full h-14 pl-6 pr-16 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-blue-600 bg-stone-50 text-sm font-medium disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isProcessing || isFinished}
            className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Anamnesis;
