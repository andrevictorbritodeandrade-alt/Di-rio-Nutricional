import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function addHistoricalData() {
  const userId = 'andre';
  const docRef = doc(db, 'users', userId, 'progress', 'main');
  
  const docSnap = await getDoc(docRef);
  let healthMeasurements = [];
  if (docSnap.exists() && docSnap.data().healthMeasurements) {
    healthMeasurements = docSnap.data().healthMeasurements;
  }

  const newMeasurements = [
    {
      id: Date.now() - 100000,
      type: 'glucose',
      value: '41',
      time: '20:00',
      period: 'noite',
      date: '2026-04-11',
      timestamp: new Date('2026-04-11T20:00:00').getTime()
    },
    {
      id: Date.now() - 50000,
      type: 'glucose',
      value: '27',
      time: '14:00',
      period: 'tarde',
      date: '2026-04-12',
      timestamp: new Date('2026-04-12T14:00:00').getTime()
    },
    {
      id: Date.now() - 10000,
      type: 'bp',
      value: '124/78',
      time: '10:00',
      period: 'manha',
      date: '2026-04-14',
      timestamp: new Date('2026-04-14T10:00:00').getTime()
    }
  ];

  // Check if they already exist
  const existingIds = new Set(healthMeasurements.map((m: any) => m.date + m.type));
  const toAdd = newMeasurements.filter(m => !existingIds.has(m.date + m.type));

  if (toAdd.length > 0) {
    healthMeasurements = [...healthMeasurements, ...toAdd];
    await setDoc(docRef, { healthMeasurements }, { merge: true });
    console.log("Historical data added successfully!");
  } else {
    console.log("Historical data already exists.");
  }
}

addHistoricalData().catch(console.error);
