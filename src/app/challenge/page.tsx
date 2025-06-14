
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/lib/firebase/firestore'; 
import { fetchDailyProgrammingProblem } from '@/ai/flows/fetch-daily-problem-flow';
import type { DailyChallenge, UserProfile } from '@/types';
import ChallengeDisplay from '@/components/challenge/ChallengeDisplay';
import SolutionForm from '@/components/challenge/SolutionForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DailyChallengePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(userProfile);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      setIsLoadingChallenge(true);
      const currentChallenge = await fetchDailyProgrammingProblem(); 
      setChallenge(currentChallenge);
      setIsLoadingChallenge(false);
    };
    fetchChallenge();
  }, []);

  useEffect(() => {
    if (user) {
      setCurrentUserProfile(userProfile);
    }
  }, [user, userProfile]);

  const handleSolutionSuccess = async (pointsAwarded: number) => {
    if (user) {
      // Re-fetch user profile to update stats immediately
      // Alternatively, update local state optimistically then sync
      const updatedProfile = await getUserProfile(user.uid);
      setCurrentUserProfile(updatedProfile);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ChallengePageSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Please sign in to view and solve the daily challenge.
        </p>        
        <Button asChild size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-6">Daily Challenge</h1>
          {isLoadingChallenge ? (
            <ChallengeSkeleton />
          ) : challenge ? (
            <>
              <ChallengeDisplay challenge={challenge} />
              <SolutionForm
                challengeId={challenge.id} 
                userId={user.uid}
                onSubmitSuccess={handleSolutionSuccess}
              />
            </>
          ) : (
            <div className="text-center py-10 bg-card p-8 rounded-lg shadow-md">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-headline text-2xl mb-2">No Challenge Today</h2>
              <p className="text-muted-foreground">Could not fetch a programming challenge. Please try again later!</p>
            </div>
          )}
        </div>
        <aside className="lg:w-1/3 space-y-6">
          <div className="p-6 bg-card rounded-lg shadow-md">
            <h3 className="font-headline text-xl font-semibold mb-4">Your Stats</h3>
            {currentUserProfile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center"><Zap className="w-5 h-5 mr-2 text-primary" /> Total Points:</span>
                  <span className="font-bold text-lg text-primary">{currentUserProfile.points ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-accent" /> Daily Streak:</span>
                  <span className="font-bold text-lg text-accent">{currentUserProfile.dailyChallengeStreak ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            )}
          </div>
          <div className="p-6 bg-card rounded-lg shadow-md">
             <h3 className="font-headline text-xl font-semibold mb-4">How it works</h3>
             <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm">
                <li>A new programming challenge appears daily.</li>
                <li>The full problem description is displayed below.</li>
                <li>Submit your solution approach or code snippet here to earn points.</li>
                <li>Maintain your daily streak for bonus rewards (coming soon!).</li>
                <li>Solutions are evaluated based on correctness and efficiency (simulated).</li>
             </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

const ChallengePageSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-8">
    <div className="lg:w-2/3">
      <Skeleton className="h-10 w-1/2 mb-6" />
      <ChallengeSkeleton />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-6 w-1/4 mb-1" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    </div>
    <aside className="lg:w-1/3 space-y-6">
      <div className="p-6 bg-card rounded-lg shadow-md">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
      <div className="p-6 bg-card rounded-lg shadow-md">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </aside>
  </div>
);

const ChallengeSkeleton = () => (
  <div className="w-full shadow-xl bg-card p-6 rounded-lg">
    <div className="flex justify-between items-start mb-2">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-16" />
    </div>
    <div className="flex space-x-4 mb-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-5 w-1/4" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-5/6 mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);
