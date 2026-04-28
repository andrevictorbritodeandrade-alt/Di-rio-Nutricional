import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json';

const app = initializeApp(config);
// We don't have auth but we don't need it if security rules allow us, wait, the security rules might block node.js without Admin SDK!
