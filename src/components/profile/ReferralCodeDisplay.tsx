
'use client';

import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Gift } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralCodeDisplayProps {
  profileBeingViewed: UserProfile | null; // Can be null if profile is still loading
}

export default function ReferralCodeDisplay({ profileBeingViewed }: ReferralCodeDisplayProps) {
  const { userProfile: currentUserProfile, loading: authLoading } = useAuth();

  if (authLoading) {
    // Optional: Show a skeleton specifically for the referral code card if it's likely to appear
    // For this to be effective, we'd need to predict if the user *is* the owner *before* auth loads,
    // or just show a generic loading state. Here, we'll show it if profileBeingViewed is potentially the user.
    // This specific skeleton will only show if profileBeingViewed (profile data) is loaded but auth is still loading.
    if (profileBeingViewed && profileBeingViewed.uid === currentUserProfile?.uid) {
      return (
        <section>
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </section>
      );
    }
    return null; // Or a smaller loading indicator
  }

  if (!profileBeingViewed || !currentUserProfile) {
    return null; // Either profile data or auth data isn't ready
  }

  const isOwnProfile = currentUserProfile.uid === profileBeingViewed.uid;

  if (isOwnProfile && profileBeingViewed.globalReferralCode) {
    return (
      <section>
        <h2 className="font-headline text-2xl font-semibold mb-4 text-primary flex items-center">
          <Gift className="w-6 h-6 mr-2" /> Your Referral Code
        </h2>
        <Card className="bg-primary/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-primary/80 mb-1">Share this code with your friends!</p>
            <p className="text-2xl font-mono font-bold text-primary tracking-wider select-all">
              {profileBeingViewed.globalReferralCode}
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
  return null;
}
