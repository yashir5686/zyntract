
'use client';

import SignInForm from '@/components/auth/SignInForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Zap } from 'lucide-react'; // Or your chosen logo icon

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard'); // Or wherever you want to redirect logged-in users
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    // Show a loader or nothing while redirecting
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
             <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-primary"
              >
                <polygon
                  points="12,2 19.82,6.5 19.82,15.5 12,20 4.18,15.5 4.18,6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                />
                <text
                  x="12"
                  y="12.5" 
                  fontFamily="Space Grotesk, sans-serif"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="currentColor"
                >
                  Z
                </text>
              </svg>
          </div>
          <CardTitle className="font-headline text-3xl">Sign In to Zyntract</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
