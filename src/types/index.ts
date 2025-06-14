
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
  createdAt?: string | null; // ISO date string from Firestore Timestamp
  lastLogin?: string | null; // ISO date string from Firestore Timestamp
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
  createdAt?: string; // ISO date string from Firestore Timestamp
}

export interface CampaignApplication {
  id: string; // Firestore document ID
  userId: string;
  campaignId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string; // ISO date string from Firestore Timestamp
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
  submittedAt: string; // ISO date string from Firestore Timestamp
  pointsAwarded?: number;
}

// New types for campaign content
export interface Course {
  id: string; // Firestore document ID
  campaignId: string;
  title: string;
  description: string;
  courseUrl: string; 
  resources?: Array<{ name: string; url: string }>;
  createdAt: string; // ISO date string from Firestore Timestamp
}

export interface Project {
  id: string; // Firestore document ID
  campaignId: string;
  title: string;
  description: string;
  submissionLinkRequired?: boolean;
  learningObjectives?: string[];
  createdAt: string; // ISO date string from Firestore Timestamp
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
  createdAt: string; // ISO date string from Firestore Timestamp
}

export interface UserCourseCertificate {
  id: string; // Firestore document ID
  userId: string;
  campaignId: string;
  courseId: string;
  userName?: string; 
  userEmail?: string; 
  certificateUrl: string;
  status: 'review' | 'approved' | 'rejected';
  submittedAt: string; // ISO date string from Firestore Timestamp
  reviewedAt?: string | null; // ISO date string from Firestore Timestamp
  adminNotes?: string | null;
}

