
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string | null; 
  phoneNumber?: string | null; 
  dailyChallengeStreak?: number;
  points?: number;
  isAdmin?: boolean;
  createdAt?: string | null; // Changed from any
  lastLogin?: string | null; // Changed from any
  profileCompleted?: boolean; 
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: 'ongoing' | 'upcoming' | 'past';
  imageUrl?: string;
  requiredPoints?: number;
  applyLink?: string;
  createdAt?: string; // Added for consistency if returned from DB
}

export interface CampaignApplication {
  id?: string;
  userId: string;
  campaignId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string; // Changed from Date
  userName?: string;
  userEmail?: string;
  campaignName?: string;
  appliedAtTimestamp?: string; // if you intend to pass this to client
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  date: string; // ISO date string for when this challenge is active
}

export interface UserSolution {
  challengeId: string;
  userId: string;
  solution: string;
  submittedAt: string; // Changed from Date
  pointsAwarded?: number;
  submittedAtTimestamp?: string; // if you intend to pass this to client
}
