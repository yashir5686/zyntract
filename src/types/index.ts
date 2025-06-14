
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string | null; // Added: Unique username
  phoneNumber?: string | null; // Added: Optional phone number
  dailyChallengeStreak?: number;
  points?: number;
  isAdmin?: boolean;
  createdAt?: any; // To store server timestamp
  lastLogin?: any; // To store server timestamp
  profileCompleted?: boolean; // To track if profile completion step is done
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
}

export interface CampaignApplication {
  id?: string;
  userId: string;
  campaignId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  userName?: string;
  userEmail?: string;
  campaignName?: string;
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
  submittedAt: Date;
  pointsAwarded?: number;
}
