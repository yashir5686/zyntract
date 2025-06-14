
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { UserProfile } from '@/types';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
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
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          // If lastLogin is not set (e.g., for users created via Google Auth previously)
          // or if the profile was created by the new signup flow but not yet completed
          if (!profileData.lastLogin || (!profileData.profileCompleted && !profileData.username)) {
             await updateDoc(userRef, { lastLogin: serverTimestamp() });
             userSnap = await getDoc(userRef); // Re-fetch to get updated data
          }
          const updatedProfileData = userSnap.data() as UserProfile;
          setUserProfile(updatedProfileData);
          setIsAdmin(updatedProfileData.isAdmin === true);
          
          // Redirect to complete profile if not done and not already on complete-profile page
          if (!updatedProfileData.profileCompleted && window.location.pathname !== '/complete-profile' && window.location.pathname !== '/signup') {
            router.push('/complete-profile');
          }

        } else {
          // This case should ideally be handled by the signUpWithEmailPassword function
          // creating the initial profile. If somehow a user is authenticated but has no profile,
          // we create a basic one here and redirect to complete-profile.
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || null, // May be null with email/pass
            photoURL: firebaseUser.photoURL || null, // May be null
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  if (loading && typeof window !== 'undefined' && window.location.pathname !== '/') {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="hidden md:flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
             <Skeleton className="h-10 w-24" />
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t border-border/40 bg-background/95">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <Skeleton className="h-6 w-48" />
             <Skeleton className="h-6 w-32" />
          </div>
        </footer>
      </div>
    );
  }

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
