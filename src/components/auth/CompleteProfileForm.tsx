
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { checkUsernameExists, updateUserProfile } from '@/lib/firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { User, AtSign, Phone, CheckCircle } from 'lucide-react';

const completeProfileSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50, { message: 'Name cannot exceed 50 characters.' }),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(20, { message: 'Username cannot exceed 20 characters.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores.' }),
  phoneNumber: z.string().optional().or(z.literal('')), // Optional phone number
});

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export default function CompleteProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || '',
      username: userProfile?.username || '',
      phoneNumber: userProfile?.phoneNumber || '',
    },
  });

  useEffect(() => {
    if (!authLoading && userProfile) {
      form.reset({
        displayName: userProfile.displayName || '',
        username: userProfile.username || '',
        phoneNumber: userProfile.phoneNumber || '',
      });
      if (userProfile.profileCompleted) {
        // If profile is already marked complete, redirect
        router.replace('/dashboard');
      }
    }
  }, [userProfile, authLoading, form, router]);


  const onSubmit = async (data: CompleteProfileFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please sign in again.' });
      router.push('/signin');
      return;
    }

    setIsLoading(true);
    try {
      // Check username uniqueness if it's being set or changed
      if (data.username && data.username.toLowerCase() !== (userProfile?.username?.toLowerCase() || '')) {
        const usernameTaken = await checkUsernameExists(data.username);
        if (usernameTaken) {
          form.setError('username', { type: 'manual', message: 'This username is already taken.' });
          setIsLoading(false);
          return;
        }
      }
      
      const profileUpdateData: Partial<UserProfile> = {
        displayName: data.displayName,
        username: data.username.toLowerCase(), // Store username in lowercase for case-insensitive check
        phoneNumber: data.phoneNumber || null,
        profileCompleted: true,
      };

      await updateUserProfile(user.uid, profileUpdateData);
      
      toast({ title: 'Profile Updated!', description: 'Your profile has been successfully completed.' });
      router.push('/dashboard'); // Redirect to dashboard or home
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Could not update profile.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return <p>Loading profile...</p>; // Or a skeleton loader
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g. Jane Doe" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g. janedoe99" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input type="tel" placeholder="e.g. +1234567890" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving Profile...' : <><CheckCircle className="mr-2 h-4 w-4" /> Complete Profile</>}
        </Button>
      </form>
    </Form>
  );
}
