import { User } from './types';

export const USERS: User[] = [
  {
    id: 'andre',
    name: 'André Brito',
    password: '1008',
    avatarDesc: 'Disney style 3D character, black male, short black shorts, Angola national football team jersey (red/black/yellow), trimmed lumberjack beard, curly hair (3C type), round glasses, smiling, vibrant background.',
    isAutistic: true,
    hasADHD: true,
    anamnesisCompleted: true, // André already has a diet in the current app
  },
  {
    id: 'marcelly',
    name: 'Marcelly Bispo',
    password: '1929',
    avatarDesc: 'Disney style 3D character, black female, long curly hair (4C type), hourglass figure (corpo violão), Flamengo jersey (red and black stripes), short black shorts, huge smile, vibrant background.',
    anamnesisCompleted: false, // Marcelly is "zerada"
  }
];
