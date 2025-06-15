
'use client';

import SignUpForm from '@/components/auth/SignUpForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // If user is already logged in, redirect them, e.g., to dashboard or complete-profile
      if (user && user.uid && !user.displayName) { // A basic check if profile might be incomplete
         router.replace('/complete-profile');
      } else {
         router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
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
           <div className="mx-auto mb-4 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary">
              <defs>
                <linearGradient id="logoGradientSignup" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: 'hsl(220, 100%, 57%)'}} />
                  <stop offset="100%" style={{stopColor: 'hsl(263, 100%, 50%)'}} />
                </linearGradient>
              </defs>
              <polygon
                points="12,1.5 21.5,6 21.5,18 12,22.5 2.5,18 2.5,6"
                fill="url(#logoGradientSignup)"
              />
              <path d="M2.8,14.5 L8,12 L5.5,9" stroke="hsl(220, 100%, 75%)" strokeWidth="0.65" fill="none" />
              <circle cx="2.8" cy="14.5" r="0.9" fill="hsl(220, 100%, 75%)" />
              <circle cx="8" cy="12" r="0.9" fill="hsl(220, 100%, 75%)" />
              <circle cx="5.5" cy="9" r="0.9" fill="hsl(220, 100%, 75%)" />
              <path d="M21.2,9.5 L16,12 L18.5,15" stroke="hsl(263, 100%, 75%)" strokeWidth="0.65" fill="none" />
              <circle cx="21.2" cy="9.5" r="0.9" fill="hsl(263, 100%, 75%)" />
              <circle cx="16" cy="12" r="0.9" fill="hsl(263, 100%, 75%)" />
              <circle cx="18.5" cy="15" r="0.9" fill="hsl(263, 100%, 75%)" />
              <path
                d="M6.5,7.5 H17.5 V9.5 L9.5,15.5 H17.5 V17.5 H6.5 V15.5 L14.5,9.5 H6.5 V7.5 Z"
                fill="white"
              />
            </svg>
          </div>
          <CardTitle className="font-headline text-3xl">Create Your Zyntract Account</CardTitle>
          <CardDescription>Join our community of innovators and builders.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}
