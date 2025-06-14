
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserProfile, 
  getUserDailyChallengeSubmission, 
  getAllSubmissionsForDailyProblem 
} from '@/lib/firebase/firestore'; 
import { fetchDailyProgrammingProblem } from '@/ai/flows/fetch-daily-problem-flow';
import type { DailyChallenge, UserProfile, UserDailyChallengeSubmission } from '@/types';
import ChallengeDisplay from '@/components/challenge/ChallengeDisplay';
import SolutionForm from '@/components/challenge/SolutionForm';
import SubmissionsReviewList from '@/components/challenge/SubmissionsReviewList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, TrendingUp, AlertCircle, Loader2, Eye, ShieldCheck, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DailyChallengePage() {
  const { user, userProfile, loading: authLoading, isAdmin } = useAuth();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(userProfile);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [userSubmission, setUserSubmission] = useState<UserDailyChallengeSubmission | null>(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(true);
  const [allSubmissions, setAllSubmissions] = useState<UserDailyChallengeSubmission[]>([]);
  const [isLoadingAllSubmissions, setIsLoadingAllSubmissions] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    if (isAdmin) {
      setCurrentViewMode('admin');
    } else {
      setCurrentViewMode('user');
    }
  }, [isAdmin]);

  const fetchChallengeData = useCallback(async () => {
    setIsLoadingChallenge(true);
    setIsLoadingSubmission(true);

    console.log("Fetching daily programming problem for challenge page...");
    const currentChallenge = await fetchDailyProgrammingProblem(); 
    setChallenge(currentChallenge);
    setIsLoadingChallenge(false);

    if (currentChallenge && user) {
      console.log("Fetching user submission for challenge (problem ID):", currentChallenge.id, "on date:", currentChallenge.date);
      const submission = await getUserDailyChallengeSubmission(user.uid, currentChallenge.date);
      setUserSubmission(submission);
    }
    setIsLoadingSubmission(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) { 
        fetchChallengeData();
    }
  }, [authLoading, fetchChallengeData]); 

  const fetchAllSubmissionsForAdmin = useCallback(async () => {
    if (isAdmin && currentViewMode === 'admin' && challenge) {
      setIsLoadingAllSubmissions(true);
      const submissions = await getAllSubmissionsForDailyProblem(challenge.date);
      setAllSubmissions(submissions);
      setIsLoadingAllSubmissions(false);
    }
  }, [isAdmin, currentViewMode, challenge]);

  useEffect(() => {
    fetchAllSubmissionsForAdmin();
  }, [fetchAllSubmissionsForAdmin]);


  useEffect(() => {
    if (user) {
      setCurrentUserProfile(userProfile);
    }
  }, [user, userProfile]);

  const handleSolutionSubmitted = (submission: UserDailyChallengeSubmission) => {
    setUserSubmission(submission); 
    // If admin submitted through user view, refresh admin list too
    if (isAdmin && currentViewMode === 'admin') {
        fetchAllSubmissionsForAdmin();
    }
  };
  
  const handleSubmissionReviewed = () => {
    // Re-fetch all submissions for admin view
    fetchAllSubmissionsForAdmin();
    // Re-fetch current user's submission if they are the one being reviewed (edge case, but good practice)
    if (challenge && user) {
        getUserDailyChallengeSubmission(user.uid, challenge.date).then(setUserSubmission);
    }
  };

  const handleToggleView = () => {
    if (isAdmin) {
      setCurrentViewMode(prevMode => (prevMode === 'admin' ? 'user' : 'admin'));
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ChallengePageSkeleton />
      </div>
    );
  }

  if (!user && currentViewMode === 'user') { 
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
  
  const displayLoadingUserView = isLoadingChallenge || (challenge && user && isLoadingSubmission && currentViewMode === 'user');
  const showAdminView = isAdmin && currentViewMode === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      {isAdmin && (
        <div className="mb-6 flex justify-end">
          <Button onClick={handleToggleView} variant="outline" size="sm">
            {currentViewMode === 'admin' ? (
              <><Eye className="mr-2 h-4 w-4" /> View as User</>
            ) : (
              <><ShieldCheck className="mr-2 h-4 w-4" /> Switch to Admin View</>
            )}
          </Button>
        </div>
      )}

      {showAdminView ? (
        // Admin View
        <>
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-6">Daily Challenge (Admin Panel)</h1>
          {isLoadingChallenge ? ( 
            <ChallengeSkeleton />
          ) : challenge ? (
            <>
                <ChallengeDisplay challenge={challenge} />
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/> Review Submissions</CardTitle>
                        <CardDescription>Review and manage user submissions for today's challenge: "{challenge.title}".</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAllSubmissions ? (
                             <div className="flex justify-center items-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="ml-2 text-muted-foreground">Loading submissions...</p>
                            </div>
                        ) : allSubmissions.length > 0 ? (
                            <SubmissionsReviewList 
                                submissions={allSubmissions}
                                dailyProblemDate={challenge.date}
                                challengePoints={challenge.points}
                                onSubmissionUpdate={handleSubmissionReviewed}
                            />
                        ) : (
                            <p className="text-muted-foreground text-center py-6">No submissions yet for this challenge.</p>
                        )}
                    </CardContent>
                </Card>
            </>
          ) : (
            <div className="text-center py-10 bg-card p-8 rounded-lg shadow-md">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-headline text-2xl mb-2">No Challenge Today</h2>
              <p className="text-muted-foreground">Could not fetch a programming challenge. Please try again later!</p>
            </div>
          )}
        </>
      ) : (
        // User View
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <h1 className="font-headline text-3xl md:text-4xl font-bold mb-6">Daily Challenge</h1>
            {displayLoadingUserView ? (
              <ChallengeSkeleton />
            ) : challenge ? (
              <>
                <ChallengeDisplay challenge={challenge} />
                {user && ( 
                   <SolutionForm
                      challengeId={challenge.id} 
                      dailyProblemDate={challenge.date} 
                      userId={user.uid}
                      existingSubmission={userSubmission}
                      onSolutionSubmitted={handleSolutionSubmitted}
                    />
                )}
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
                  <li>Problem description and examples are displayed.</li>
                  <li>Use the integrated code editor to write your solution and select your language.</li>
                  <li>Submit your solution for review. You can only submit once per challenge.</li>
                  <li>Admins will review submissions. Points and streaks are updated upon approval.</li>
               </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

const ChallengePageSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-8">
    <div className="lg:w-2/3">
      <Skeleton className="h-10 w-1/2 mb-6" />
      <ChallengeSkeleton /> 
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-1/3 mb-2" /> 
        <Skeleton className="h-10 w-1/4 mb-2" /> 
        <Skeleton className="h-[300px] w-full" /> 
        <Skeleton className="h-10 w-48" /> 
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
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-6 w-1/4 mt-4 mb-2" /> 
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-6 w-1/4 mt-4 mb-2" />
    <Skeleton className="h-12 w-full" />
  </div>
);

