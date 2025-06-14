import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '@/types';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<UserProfile | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let userProfileData: UserProfile;

      if (userSnap.exists()) {
        userProfileData = userSnap.data() as UserProfile;
      } else {
        userProfileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          dailyChallengeStreak: 0,
          points: 0,
          isAdmin: false, // Default new users are not admins
        };
        await setDoc(userRef, { ...userProfileData, createdAt: serverTimestamp(), lastLogin: serverTimestamp() });
      }
      return userProfileData;
    }
    return null;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error; // Re-throw to be caught by UI
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
