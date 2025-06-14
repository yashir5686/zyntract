
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type UserCredential
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

export const signUpWithEmailPassword = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a basic user profile document. More details will be added after profile completion.
    const userRef = doc(db, 'users', user.uid);
    const initialProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: null, // Will be set in complete profile step
      photoURL: null, // No custom pics for now
      username: null, // Will be set in complete profile step
      phoneNumber: null, // Will be set in complete profile step
      dailyChallengeStreak: 0,
      points: 0,
      isAdmin: false,
      profileCompleted: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };
    await setDoc(userRef, initialProfile);
    return userCredential;
  } catch (error) {
    console.error("Error signing up with email and password: ", error);
    throw error;
  }
};

export const signInWithEmailPassword = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Update lastLogin timestamp
    const userRef = doc(db, 'users', userCredential.user.uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
    return userCredential;
  } catch (error) {
    console.error("Error signing in with email and password: ", error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};
