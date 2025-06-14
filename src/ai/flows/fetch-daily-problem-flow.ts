
'use server';
/**
 * @fileOverview Fetches a daily programming problem from a JSON source.
 *
 * - fetchDailyProgrammingProblem - A function that retrieves and formats a problem.
 * - DailyChallengeOutput - The return type (reusing existing DailyChallenge type from @/types).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { DailyChallenge } from '@/types';

// Define output schema based on existing DailyChallenge type
const DailyChallengeOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(), // This will contain HTML content
  difficulty: z.enum(['easy', 'medium', 'hard']),
  points: z.number(),
  date: z.string(), // ISO date string
});

interface LeetCodeProblemSource {
  question_id: number;
  question__title: string;
  question__title_slug: string; // Potentially useful for constructing a direct LeetCode link if needed
  difficulty: { level: number }; // 1: Easy, 2: Medium, 3: Hard
  question__content: string; // HTML content of the problem
  // other fields exist but are not used for the DailyChallenge mapping
}

interface LeetCodeProblemsResponse {
  [key: string]: LeetCodeProblemSource;
}

// Helper function to map LeetCode difficulty level to 'easy' | 'medium' | 'hard'
const mapLevelToDifficulty = (level: number): 'easy' | 'medium' | 'hard' => {
  if (level === 1) return 'easy';
  if (level === 2) return 'medium';
  if (level === 3) return 'hard';
  return 'medium'; // Default
};

// Helper function to assign points based on difficulty
const getPointsForDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy': return 10;
    case 'medium': return 25;
    case 'hard': return 50;
    default: return 10;
  }
};

export async function fetchDailyProgrammingProblem(): Promise<DailyChallenge | null> {
  return fetchLeetCodeProblemFlow({});
}

const fetchLeetCodeProblemFlow = ai.defineFlow(
  {
    name: 'fetchLeetCodeProblemFlow',
    inputSchema: z.object({}), // No specific input for now
    outputSchema: DailyChallengeOutputSchema.nullable(),
  },
  async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/noworneverev/leetcode-api/refs/heads/main/data/leetcode_questions.json');
      if (!response.ok) {
        console.error('LeetCode JSON API request failed:', response.status, await response.text());
        return null;
      }

      const data: LeetCodeProblemsResponse = await response.json();
      const problemsArray = Object.values(data);

      if (!problemsArray || problemsArray.length === 0) {
        console.error('LeetCode JSON API did not return problems or no problems found.');
        return null;
      }
      
      // Filter for problems that have content (some might be stubs or premium)
      const suitableProblems = problemsArray.filter(p => p.question__content && p.difficulty && p.question__title);

      if (suitableProblems.length === 0) {
        console.warn('No suitable programming problems found from LeetCode JSON based on initial filter.');
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * suitableProblems.length);
      const problem = suitableProblems[randomIndex];

      if (!problem || !problem.question_id || !problem.question__title || !problem.question__content) {
        console.error('Selected problem is missing essential fields (id, title, content).');
        return null;
      }

      const difficulty = mapLevelToDifficulty(problem.difficulty.level);
      const points = getPointsForDifficulty(difficulty);
      const problemId = `LC-${problem.question_id}`;

      return {
        id: problemId,
        title: problem.question__title,
        description: problem.question__content, // HTML content
        difficulty: difficulty,
        points: points,
        date: new Date().toISOString().split('T')[0], // Today's date
      };
    } catch (error) {
      console.error('Error fetching or processing LeetCode problem:', error);
      return null;
    }
  }
);
