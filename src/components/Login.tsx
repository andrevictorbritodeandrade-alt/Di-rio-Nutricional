import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { USERS } from '../constants';
import { User } from '../types';
import { Lock, User as UserIcon, Loader2, ChefHat, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const generateAvatars = async (force = false) => {
    if (force) {
      setIsRefreshing(true);
      USERS.forEach(u => {
        try {
          localStorage.removeItem(`avatar_${u.id}`);
        } catch (e) {
          console.warn("Erro ao acessar localStorage:", e);
        }
      });
    } else {
      setLoadingAvatars(true);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("ERRO: GEMINI_API_KEY não encontrada. Verifique as variáveis de ambiente.");
      setLoadingAvatars(false);
      setIsRefreshing(false);
      return;
    }
    console.log("API Key encontrada, iniciando geração...");
    const ai = new GoogleGenAI({ apiKey });
    const newAvatars: Record<string, string> = { ...avatars };

    try {
      for (const user of USERS) {
        try {
          // 1. Tenta buscar do localStorage primeiro (cache local ultra rápido)
          let localCache = null;
          try {
            localCache = localStorage.getItem(`avatar_${user.id}`);
          } catch (e) {
            console.warn("Erro ao ler localStorage:", e);
          }
          
          if (localCache && !force) {
            newAvatars[user.id] = localCache;
            continue;
          }

          // 2. Tenta buscar do Firestore (cache compartilhado)
          if (!force) {
            const userDoc = await getDoc(doc(db, 'users', user.id));
            if (userDoc.exists() && userDoc.data().avatarUrl && !userDoc.data().avatarUrl.includes('picsum')) {
              const remoteAvatar = userDoc.data().avatarUrl;
              newAvatars[user.id] = remoteAvatar;
              try {
                localStorage.setItem(`avatar_${user.id}`, remoteAvatar);
              } catch (e) {
                console.warn("Erro ao escrever no localStorage:", e);
              }
              continue;
            }
          }

          // 3. Tenta gerar com a IA
          console.log(`Gerando avatar para ${user.name}...`);
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: {
              parts: [{ text: user.avatarDesc }],
            },
          });

          let generated = false;
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const b64 = `data:image/png;base64,${part.inlineData.data}`;
              newAvatars[user.id] = b64;
              try {
                localStorage.setItem(`avatar_${user.id}`, b64);
              } catch (e) {
                console.warn("Erro ao escrever no localStorage:", e);
              }
              generated = true;
              break;
            }
          }
          
          if (!generated) {
            newAvatars[user.id] = user.avatarUrl || `https://picsum.photos/seed/${user.id}/200/200`;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (err: any) {
          if (err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('429')) {
            console.warn(`Cota de IA excedida para ${user.name}. Usando fallback.`);
          } else {
            console.error(`Error generating avatar for ${user.name}:`, err);
          }
          newAvatars[user.id] = user.avatarUrl || `https://picsum.photos/seed/${user.id}/200/200`;
        }
      }
      setAvatars(newAvatars);
    } catch (err) {
      console.error("Error in generateAvatars loop:", err);
    } finally {
      setLoadingAvatars(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    generateAvatars();
  }, []);

  const handleLogin = async (user: User) => {
    setIsLoggingIn(true);
    try {
      onLogin({
        ...user,
        avatarUrl: avatars[user.id]
      });

      // Salva o usuário no Firestore (sem salvar o avatar base64 para evitar exceder o limite de 1MB)
      if (avatars[user.id]) {
        const { password, ...userData } = user;
        await setDoc(doc(db, 'users', user.id), {
          ...userData,
        }, { merge: true });
      }
    } catch (err: any) {
      console.error("Erro ao salvar dados no Firestore:", err);
      // Mesmo se falhar o cache, faz o login local
      onLogin({
        ...user,
        avatarUrl: avatars[user.id]
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[100px] opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-12 relative z-10"
      >
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-[1000] text-slate-900 tracking-[-0.08em] font-montserrat uppercase flex items-center justify-center gap-1 flex-wrap">
            <span className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-100 shrink-0">
              <Utensils size={32} />
            </span>
            <div className="flex flex-wrap justify-center">
              <span>DIÁRIO</span>
              <span className="text-blue-600">NUTRICIONAL</span>
            </div>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
            Escolha seu perfil para continuar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {USERS.map((user, idx) => (
            <motion.button
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogin(user)}
              className={`flex flex-col items-center gap-5 p-8 rounded-[3rem] transition-all duration-500 relative group bg-white text-slate-800 shadow-xl shadow-stone-200/50 border border-stone-100 hover:border-blue-600`}
            >
              <div className="w-28 h-28 rounded-full overflow-hidden bg-stone-50 border-4 border-white shadow-inner flex items-center justify-center relative z-10">
                {loadingAvatars ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <span className="text-[8px] font-black text-blue-600 uppercase">Gerando...</span>
                  </div>
                ) : avatars[user.id] ? (
                  <img src={avatars[user.id]} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-stone-300" />
                )}
              </div>
              <div className="space-y-1">
                <span className="font-black uppercase tracking-wider text-xs block">{user.name}</span>
                {selectedUser?.id === user.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="h-1 w-8 bg-white/40 rounded-full mx-auto"
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {isLoggingIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 text-blue-600 font-black uppercase tracking-widest text-xs pt-8"
            >
              <Loader2 className="animate-spin" size={20} />
              <span>Carregando Diário...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
          Powered by <span className="text-blue-600">André Brito</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
