
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
  startDate: string; 
  endDate: string; 
  status: 'ongoing' | 'upcoming' | 'past';
  imageUrl?: string;
  requiredPoints?: number;
  applyLink?: string;
  createdAt?: string; 
}

export interface CampaignApplication {
  id: string; 
  userId: string;
  campaignId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string; 
  userName?: string;
  userEmail?: string;
  campaignName?: string;
}

export interface ChallengeExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface DailyChallenge {
  id: string; // This will be the unique ID, e.g., "Leet-1" or "CF-problem-id"
  title: string;
  description: string; // HTML content
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  date: string; // YYYY-MM-DD for when this challenge is active
  examples: ChallengeExample[];
}

// Renamed from UserSolution to be more specific
export interface UserDailyChallengeSubmission {
  id: string; // Firestore document ID
  userId: string;
  challengeId: string; // ID of the DailyChallenge (e.g., "Leet-1")
  code: string;
  language: string;
  submittedAt: string; // ISO string
  status: 'review' | 'approved' | 'rejected';
  reviewedAt?: string | null; // ISO string, when admin reviewed
  adminNotes?: string | null;
}

export interface DailyProblemCache {
  cachedDate: string; // YYYY-MM-DD
  problem: DailyChallenge;
}


// New types for campaign content
export interface Course {
  id: string; 
  campaignId: string;
  title: string;
  description: string;
  courseUrl: string; 
  resources?: Array<{ name: string; url: string }>;
  createdAt: string; 
}

export interface Project {
  id: string; 
  campaignId: string;
  title: string;
  description: string;
  submissionLinkRequired?: boolean;
  learningObjectives?: string[];
  createdAt: string; 
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string; 
}

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
}

export interface QuizChallenge {
  id: string; 
  campaignId: string;
  title: string;
  description: string;
  type: 'quiz' | 'coding_problem';
  points: number;
  questions?: QuizQuestion[]; 
  codingPrompt?: string; 
  testCases?: CodingTestCase[]; 
  createdAt: string; 
}

export interface UserCourseCertificate {
  id: string; 
  userId: string;
  campaignId: string;
  courseId: string;
  userName?: string; 
  userEmail?: string; 
  certificateUrl: string;
  status: 'review' | 'approved' | 'rejected';
  submittedAt: string; 
  reviewedAt?: string | null; 
  adminNotes?: string | null;
}
