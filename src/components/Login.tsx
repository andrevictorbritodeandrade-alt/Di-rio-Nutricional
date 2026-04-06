import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { USERS } from '../constants';
import { User } from '../types';
import { Lock, User as UserIcon, Loader2, ChefHat, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  useEffect(() => {
    const generateAvatars = async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("API Key não configurada para geração de avatares.");
        setLoadingAvatars(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const newAvatars: Record<string, string> = {};

      try {
        for (const user of USERS) {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: user.avatarDesc }],
            },
            config: {
              imageConfig: { aspectRatio: "1:1" }
            }
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              newAvatars[user.id] = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        setAvatars(newAvatars);
      } catch (err) {
        console.error("Error generating avatars:", err);
      } finally {
        setLoadingAvatars(false);
      }
    };

    generateAvatars();
  }, []);

  const handleLogin = () => {
    if (selectedUser && password === selectedUser.password) {
      onLogin({
        ...selectedUser,
        avatarUrl: avatars[selectedUser.id]
      });
    } else {
      setError('Senha incorreta!');
      setTimeout(() => setError(''), 2000);
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
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block p-4 bg-white rounded-[2rem] shadow-xl shadow-blue-100 mb-4"
          >
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <ChefHat size={32} />
            </div>
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-montserrat uppercase flex items-center justify-center gap-3">
            <span className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-100">
              <Utensils size={24} />
            </span>
            <span>Diário <span className="text-blue-600">Nutricional</span></span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
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
              onClick={() => {
                setSelectedUser(user);
                setPassword('');
              }}
              className={`flex flex-col items-center gap-5 p-8 rounded-[3rem] transition-all duration-500 relative group ${
                selectedUser?.id === user.id 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200 ring-4 ring-blue-100' 
                : 'bg-white text-slate-800 shadow-xl shadow-stone-200/50 border border-stone-100'
              }`}
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
          {selectedUser && (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 pt-4"
            >
              <div className="relative group">
                <input
                  type="password"
                  placeholder="DIGITE SUA SENHA"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full h-16 pl-14 pr-4 rounded-[2rem] border-2 border-stone-100 focus:border-blue-600 focus:ring-0 bg-white text-center font-black tracking-[0.5em] text-xl shadow-lg transition-all"
                />
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-600 transition-colors" size={24} />
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 text-red-500 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleLogin}
                className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm active:scale-95 transition-all shadow-xl shadow-slate-200 hover:bg-blue-600"
              >
                Acessar Diário
              </button>
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
