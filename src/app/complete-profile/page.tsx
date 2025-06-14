
'use client';

import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserCheck } from 'lucide-react';

export default function CompleteProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If not logged in, redirect to sign-in
        router.replace('/signin');
      } else if (userProfile?.profileCompleted) {
        // If profile is already complete, redirect to dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading || !user || (userProfile && userProfile.profileCompleted)) {
     // Show a loader or nothing while redirecting or waiting for auth state
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserCheck className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="font-headline text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>Help us get to know you better by filling out these details.</CardDescription>
        </CardHeader>
        <CardContent>
          <CompleteProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
