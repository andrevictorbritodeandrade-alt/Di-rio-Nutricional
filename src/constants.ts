import { User } from './types';

export const USERS: User[] = [
  {
    id: 'andre',
    name: 'André Brito',
    password: '1008',
    avatarDesc: 'Disney style 3D character, tall and relatively thin black man with a beard and glasses, wearing a brown fedora hat, a leopard print short-sleeved button-up shirt, short light beige shorts (above the knee), smiling, athletic build, standing on a sunny street with colorful buildings and mountains in the background, high quality, 3d render.',
    avatarUrl: 'https://picsum.photos/seed/andre/200/200',
    isAutistic: true,
    hasADHD: true,
    anamnesisCompleted: true,
  },
  {
    id: 'marcelly',
    name: 'Marcelly Bispo',
    password: '1929',
    avatarDesc: 'Disney style 3D character, tall black woman with long dark braids, wearing yellow tinted sunglasses, a yellow leopard print one-shoulder crop top, a short yellow skirt, smiling, standing on a sunny street with colorful buildings and mountains in the background, high quality, 3d render.',
    avatarUrl: 'https://picsum.photos/seed/marcelly/200/200',
    anamnesisCompleted: false,
  }
];
