import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

export const saveUserData = async (user: User) => {
  try {
    const { password, ...userData } = user;
    await setDoc(doc(db, 'users', user.id), userData);
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

export const saveDailyLog = async (userId: string, date: string, data: any) => {
  try {
    await setDoc(doc(db, 'users', userId, 'dailyLogs', date), data, { merge: true });
  } catch (error) {
    console.error('Error saving daily log:', error);
    throw error;
  }
};

export const subscribeToDailyLog = (userId: string, date: string, callback: (data: any) => void) => {
  const docRef = doc(db, 'users', userId, 'dailyLogs', date);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};
