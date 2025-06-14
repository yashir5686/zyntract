
'use server';
/**
 * @fileOverview Fetches a daily programming problem from the Codeforces API.
 *
 * - fetchDailyCodeforcesProblem - A function that retrieves and formats a problem.
 * - DailyChallengeOutput - The return type (reusing existing DailyChallenge type from @/types).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { DailyChallenge } from '@/types';

// Define output schema based on existing DailyChallenge type
const DailyChallengeOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  points: z.number(),
  date: z.string(), // ISO date string
});

// Helper function to map Codeforces rating to difficulty
const mapRatingToDifficulty = (rating: number | undefined): 'easy' | 'medium' | 'hard' => {
  if (rating === undefined) return 'medium'; // Default if rating is not available
  if (rating < 1200) return 'easy';
  if (rating < 1800) return 'medium';
  return 'hard';
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

export async function fetchDailyCodeforcesProblem(): Promise<DailyChallenge | null> {
  return fetchCodeforcesProblemFlow({});
}

interface CodeforcesProblem {
  contestId?: number;
  index?: string;
  name?: string;
  type?: string;
  points?: number; // This is usually CF points, not our app points
  rating?: number;
  tags?: string[];
}

interface CodeforcesResponse {
  status: string;
  result?: {
    problems: CodeforcesProblem[];
    problemStatistics: any[];
  };
  comment?: string;
}

const fetchCodeforcesProblemFlow = ai.defineFlow(
  {
    name: 'fetchCodeforcesProblemFlow',
    inputSchema: z.object({}), // No specific input for now
    outputSchema: DailyChallengeOutputSchema.nullable(),
  },
  async () => {
    try {
      const response = await fetch('https://codeforces.com/api/problemset.problems');
      if (!response.ok) {
        console.error('Codeforces API request failed:', response.status, await response.text());
        return null;
      }

      const data: CodeforcesResponse = await response.json();

      if (data.status !== 'OK' || !data.result || data.result.problems.length === 0) {
        console.error('Codeforces API did not return "OK" or no problems found:', data.comment || 'No comment');
        return null;
      }

      // Filter for problems that are programming tasks and ideally have a rating
      let suitableProblems = data.result.problems.filter(p => p.type === 'PROGRAMMING' && p.contestId && p.index && p.name);

      if (suitableProblems.length === 0) {
        console.warn('No suitable programming problems found from Codeforces API based on initial filter.');
        // If no problems fit the "ideal" criteria, widen the selection to any problem.
        suitableProblems = data.result.problems.filter(p => p.contestId && p.index && p.name);
         if (suitableProblems.length === 0) {
            console.error('No problems with contestId, index, and name found from Codeforces.');
            return null;
        }
      }
      
      const randomIndex = Math.floor(Math.random() * suitableProblems.length);
      const problem = suitableProblems[randomIndex];

      if (!problem || !problem.contestId || !problem.index || !problem.name) {
        console.error('Selected problem is missing essential fields (contestId, index, name).');
        return null;
      }

      const difficulty = mapRatingToDifficulty(problem.rating); // rating can be undefined
      const points = getPointsForDifficulty(difficulty);
      const problemId = `CF-${problem.contestId}-${problem.index}`;
      const problemUrl = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;

      return {
        id: problemId,
        title: `${problem.name} (CF: ${problem.contestId}${problem.index})`,
        description: `Solve the problem: ${problem.name}\nLink: ${problemUrl}\nTags: ${problem.tags?.join(', ') || 'N/A'}\nRating: ${problem.rating || 'N/A'}`,
        difficulty: difficulty,
        points: points,
        date: new Date().toISOString().split('T')[0], // Today's date
      };
    } catch (error) {
      console.error('Error fetching or processing Codeforces problem:', error);
      return null;
    }
  }
);
