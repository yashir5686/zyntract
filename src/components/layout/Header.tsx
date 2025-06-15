
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, UserPlus, LayoutDashboard, Puzzle, HomeIcon, UserCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed Out', description: 'See you soon!' });
      router.push('/');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sign Out Failed', description: (error as Error).message });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mr-2">
            <defs>
              <linearGradient id="logoGradientHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: 'hsl(220, 100%, 57%)'}} />
                <stop offset="100%" style={{stopColor: 'hsl(263, 100%, 50%)'}} />
              </linearGradient>
            </defs>
            <polygon
              points="12,1.5 21.5,6 21.5,18 12,22.5 2.5,18 2.5,6"
              fill="url(#logoGradientHeader)"
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
          <span className="font-headline text-2xl font-bold">Zyntract</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-primary">
            Campaigns
          </Link>
          <Link href="/challenge" className="transition-colors hover:text-primary">
            Daily Challenge
          </Link>
        </nav>
        <div className="flex items-center space-x-2">
          {loading ? (
            <Button variant="outline" disabled className="w-24 h-10 animate-pulse bg-muted"></Button>
          ) : user && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    {userProfile.photoURL ? (
                      <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName || 'User'} />
                    ) : (
                       <UserCircle className="h-10 w-10 text-muted-foreground" />
                    )}
                    <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.displayName || userProfile.username || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userProfile.username && (
                  <DropdownMenuItem onClick={() => router.push(`/${userProfile.username}`)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/challenge')}>
                  <Puzzle className="mr-2 h-4 w-4" />
                  <span>Daily Challenge</span>
                </DropdownMenuItem>
                {!userProfile.profileCompleted && (
                  <DropdownMenuItem onClick={() => router.push('/complete-profile')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Complete Profile</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button onClick={() => router.push('/signin')} variant="ghost">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
              <Button onClick={() => router.push('/signup')} variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="md:hidden flex justify-around p-2 border-t border-border/40 bg-background">
        <Link href="/" className="flex flex-col items-center text-xs hover:text-primary">
          <HomeIcon className="h-5 w-5"/> Home
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center text-xs hover:text-primary">
          <LayoutDashboard className="h-5 w-5"/> Campaigns
        </Link>
        <Link href="/challenge" className="flex flex-col items-center text-xs hover:text-primary">
         <Puzzle className="h-5 w-5"/> Challenge
        </Link>
      </div>
    </header>
  );
}
