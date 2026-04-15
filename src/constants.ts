import { User } from './types';

export const USERS: User[] = [
  {
    id: 'andre',
    name: 'André Brito',
    password: '1008',
    avatarDesc: 'Disney style 3D character, black man with a full black beard and glasses, wearing a brown fedora hat, a yellow leopard print short-sleeved button-up shirt, light beige shorts, smiling, muscular and athletic build, standing on a sunny street with colorful buildings and mountains in the background, high quality, 3d render.',
    avatarUrl: 'https://picsum.photos/seed/andre_leopard/200/200',
    isAutistic: true,
    hasADHD: true,
    anamnesisCompleted: true,
  },
  {
    id: 'marcelly',
    name: 'Marcelly Bispo',
    password: '1929',
    avatarDesc: 'Disney style 3D character, beautiful black woman with voluminous curly natural hair (afro style), wearing yellow tinted sunglasses, a yellow leopard print one-shoulder crop top, a matching short yellow leopard print skirt, smiling, standing on a sunny street with colorful buildings and palm trees, high quality, 3d render.',
    avatarUrl: 'https://picsum.photos/seed/marcelly_leopard/200/200',
    anamnesisCompleted: false,
  }
];
