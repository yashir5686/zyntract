'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, User, LayoutDashboard, Puzzle, HomeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({ title: 'Signed In', description: 'Welcome back!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sign In Failed', description: (error as Error).message });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed Out', description: 'See you soon!' });
      router.push('/');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sign Out Failed', description: (error as Error).message });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="https://user-images.githubusercontent.com/36591148/288448815-2050011c-0157-4111-996f-c2958f1d3d0f.png"
            alt="Zyntract Logo"
            width={160}
            height={40}
            className="object-contain"
            priority
          />
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
        <div className="flex items-center space-x-4">
          {loading ? (
            <Button variant="outline" disabled className="w-24 h-10 animate-pulse bg-muted"></Button>
          ) : user && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
                    <AvatarFallback>{userProfile.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/challenge')}>
                  <Puzzle className="mr-2 h-4 w-4" />
                  <span>Daily Challenge</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleSignIn} variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
            </Button>
          )}
        </div>
      </div>
       {/* Mobile Navigation (placeholder, could be enhanced with a Sheet component) */}
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
