
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { UserProfile } from '@/types';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { generateGlobalReferralCode } from '@/lib/firebase/firestore'; // Import the generator

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
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap = await getDoc(userRef);
        let profileDataToSet: UserProfile;
        let needsProfileUpdate = false;
        const updates: Partial<UserProfile> = { lastLogin: serverTimestamp() };

        if (userSnap.exists()) {
          let currentProfileData = userSnap.data() as UserProfile;

          if (!currentProfileData.globalReferralCode) {
            updates.globalReferralCode = generateGlobalReferralCode(firebaseUser.uid);
            needsProfileUpdate = true;
          }
          
          // Ensure lastLogin is updated, even if referral code exists or profile is complete
          if (!currentProfileData.lastLogin || (!currentProfileData.profileCompleted && !currentProfileData.username)) {
             needsProfileUpdate = true; // lastLogin update implies a profile data change
          }


          if (needsProfileUpdate) {
            await updateDoc(userRef, updates);
            userSnap = await getDoc(userRef); // Re-fetch the updated profile
            profileDataToSet = userSnap.data() as UserProfile;
          } else {
            profileDataToSet = currentProfileData;
          }
          
          setUserProfile(profileDataToSet);
          setIsAdmin(profileDataToSet.isAdmin === true);
          
          if (!profileDataToSet.profileCompleted && window.location.pathname !== '/complete-profile' && window.location.pathname !== '/signup') {
            router.push('/complete-profile');
          }

        } else {
          // New user profile creation
          const newGlobalReferralCode = generateGlobalReferralCode(firebaseUser.uid);
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
            createdAt: serverTimestamp() as unknown as string, // Firestore handles serverTimestamp
            lastLogin: serverTimestamp() as unknown as string, // Firestore handles serverTimestamp
            globalReferralCode: newGlobalReferralCode,
          };
          await setDoc(userRef, newUserProfile);
          // To get actual server-generated timestamps, we'd ideally re-fetch, but for now, this is okay.
          // Or ensure UserProfile type allows for FieldValue for timestamp fields before serialization.
          // For simplicity, client-side state will have placeholder or null until re-fetch if strict ISO strings are needed immediately.
          // However, the current UserProfile expects string|null for createdAt/lastLogin after serialization.
          // So, let's convert to a structure that `setUserProfile` expects for consistency, even if timestamps aren't fully resolved client-side yet.
           const tempProfileForState: UserProfile = {
            ...newUserProfile,
            createdAt: new Date().toISOString(), // Approximate for local state
            lastLogin: new Date().toISOString(), // Approximate for local state
          };
          setUserProfile(tempProfileForState);
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
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

