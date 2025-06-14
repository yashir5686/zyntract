
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
  description: string; // HTML content
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  date: string; 
  examples: ChallengeExample[];
}

export interface UserSolution {
  challengeId: string;
  userId: string;
  solution: string; // Can be code or text description
  language?: string; // Optional language if it's code
  submittedAt: string; 
  pointsAwarded?: number;
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
