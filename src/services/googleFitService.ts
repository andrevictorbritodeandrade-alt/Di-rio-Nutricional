import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Workout } from '../types';

// Mapeamento simplificado de atividades do Google Fit
const getActivityName = (type: number): string => {
  const activities: Record<number, string> = {
    7: 'Caminhada',
    8: 'Corrida',
    16: 'Musculação',
    58: 'Esteira',
    // Adicione mais conforme necessário
  };
  return activities[type] || 'Atividade Física';
};

const formatDuration = (millis: number): string => {
  const minutes = Math.floor(millis / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}m`;
};

export const connectGoogleFit = async (): Promise<string | null> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
  
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    if (token) {
      localStorage.setItem('googleFitToken', token);
      return token;
    }
    return null;
  } catch (error) {
    console.error("Erro ao conectar com Google Fit:", error);
    throw error;
  }
};

export const fetchTodayWorkouts = async (): Promise<Workout[]> => {
  const token = localStorage.getItem('googleFitToken');
  if (!token) throw new Error("Não conectado ao Google Fit");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startTimeMillis = today.getTime();
  const endTimeMillis = new Date().getTime();

  // 1. Buscar Sessões de Treino
  const sessionsResponse = await fetch(`https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startTimeMillis).toISOString()}&endTime=${new Date(endTimeMillis).toISOString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!sessionsResponse.ok) {
    if (sessionsResponse.status === 401) {
      localStorage.removeItem('googleFitToken');
      throw new Error("Token expirado");
    }
    throw new Error("Erro ao buscar sessões do Google Fit");
  }

  const sessionsData = await sessionsResponse.json();
  const sessions = sessionsData.session || [];

  const workouts: Workout[] = [];

  // 2. Para cada sessão, buscar as calorias gastas
  for (const session of sessions) {
    const aggregateResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aggregateBy: [{
          dataTypeName: "com.google.calories.expended"
        }],
        bucketByTime: { durationMillis: parseInt(session.endTimeMillis) - parseInt(session.startTimeMillis) },
        startTimeMillis: parseInt(session.startTimeMillis),
        endTimeMillis: parseInt(session.endTimeMillis)
      })
    });

    let calories = 0;
    if (aggregateResponse.ok) {
      const aggData = await aggregateResponse.json();
      const bucket = aggData.bucket?.[0];
      const dataset = bucket?.dataset?.[0];
      const point = dataset?.point?.[0];
      if (point && point.value && point.value[0]) {
        calories = Math.round(point.value[0].fpVal);
      }
    }

    workouts.push({
      id: session.id,
      date: new Date(parseInt(session.startTimeMillis)).toLocaleDateString('pt-BR'),
      activity: getActivityName(session.activityType),
      duration: formatDuration(parseInt(session.endTimeMillis) - parseInt(session.startTimeMillis)),
      calories: calories
    });
  }

  return workouts;
};
