
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
  createdAt?: string | null; 
  lastLogin?: string | null; 
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
  createdAt?: string; 
}

export interface CampaignApplication {
  id: string; // Firestore document ID
  userId: string;
  campaignId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string; 
  userName?: string;
  userEmail?: string;
  campaignName?: string;
  appliedAtTimestamp?: string; 
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
  submittedAt: string; 
  pointsAwarded?: number;
  submittedAtTimestamp?: string; 
}

// New types for campaign content
export interface Course {
  id: string; // Firestore document ID
  campaignId: string;
  title: string;
  description: string;
  courseUrl: string; 
  resources?: Array<{ name: string; url: string }>;
  createdAt: string; // ISO date string
}

export interface Project {
  id: string; // Firestore document ID
  campaignId: string;
  title: string;
  description: string;
  submissionLinkRequired?: boolean;
  learningObjectives?: string[];
  createdAt: string; // ISO date string
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string; // Could be an index or the string itself
}

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
}

export interface QuizChallenge {
  id: string; // Firestore document ID
  campaignId: string;
  title: string;
  description: string;
  type: 'quiz' | 'coding_problem';
  points: number;
  questions?: QuizQuestion[]; // For type 'quiz'
  codingPrompt?: string; // For type 'coding_problem'
  testCases?: CodingTestCase[]; // For type 'coding_problem'
  createdAt: string; // ISO date string
}

export interface UserCourseCertificate {
  id: string; // Firestore document ID
  userId: string;
  campaignId: string;
  courseId: string;
  certificateUrl: string;
  status: 'review' | 'approved' | 'rejected';
  submittedAt: string; // ISO date string, effectively from submittedAtTimestamp
  submittedAtTimestamp?: any; // Firestore ServerTimestamp on create/update
  reviewedAt?: string | null; // ISO date string, from reviewedAtTimestamp
  reviewedAtTimestamp?: any | null; // Firestore ServerTimestamp on review
  adminNotes?: string | null;
}
