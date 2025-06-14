
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { UserProfile } from '@/types';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Keep setLoading(true) at the start of this callback if complex async logic follows
      // setLoading(true) was here, but it should be set to false at the end of all checks.
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          if (!profileData.lastLogin || (!profileData.profileCompleted && !profileData.username)) {
             await updateDoc(userRef, { lastLogin: serverTimestamp() });
             userSnap = await getDoc(userRef); 
          }
          const updatedProfileData = userSnap.data() as UserProfile;
          setUserProfile(updatedProfileData);
          setIsAdmin(updatedProfileData.isAdmin === true);
          
          if (!updatedProfileData.profileCompleted && window.location.pathname !== '/complete-profile' && window.location.pathname !== '/signup') {
            router.push('/complete-profile');
          }

        } else {
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || null,
            photoURL: firebaseUser.photoURL || null,
            username: null,
            phoneNumber: null,
            dailyChallengeStreak: 0,
            points: 0,
            isAdmin: false,
            profileCompleted: false,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          };
          await setDoc(userRef, newUserProfile);
          setUserProfile(newUserProfile);
          setIsAdmin(false);
          if (window.location.pathname !== '/complete-profile' && window.location.pathname !== '/signup') {
             router.push('/complete-profile');
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false); // Set loading to false after all auth logic is complete
    });

    return () => unsubscribe();
  }, [router]);
  
  // The full-page skeleton previously here was causing hydration issues.
  // Child components (Header, pages) already use useAuth().loading for their specific skeletons.
  // AuthProvider should consistently render its children to avoid mismatches.
  // If `loading` is true, the children will receive `loading: true` via context and can react accordingly.

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
