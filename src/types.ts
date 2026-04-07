export interface HealthMeasurement {
  time: string;
  glucose: string;
  bloodPressure: string;
  heartRate: string;
}

export interface User {
  id: string;
  name: string;
  password: string;
  avatarDesc: string;
  avatarUrl?: string;
  isAutistic?: boolean;
  hasADHD?: boolean;
  dietPlan?: DietPlan;
  anamnesisCompleted?: boolean;
}

export interface DietPlan {
  startDate: string;
  endDate: string;
  kcalGoal: number;
  macros: {
    p: number;
    c: number;
    g: number;
  };
  meals: any[]; // Simplified for now
}

export interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
}
