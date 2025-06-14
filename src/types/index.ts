
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
  id: string; 
  title: string;
  description: string; 
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  date: string; // YYYY-MM-DD format, used as ID in 'dailyProblems' collection
  examples: ChallengeExample[];
  cachedAt?: string; // ISO string, when this problem was last saved to our DB
}

export interface UserDailyChallengeSubmission {
  id: string; // Will be the userId
  userId: string;
  challengeId: string; // The original problem ID (e.g., Leet-123)
  dailyProblemDate: string; // The date (YYYY-MM-DD) for which this problem was assigned
  userName?: string; // User's name at time of submission
  userEmail?: string; // User's email at time of submission
  code: string;
  language: string;
  submittedAt: string; // ISO string
  status: 'review' | 'approved' | 'rejected';
  reviewedAt?: string | null; // ISO string
  adminNotes?: string | null;
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

