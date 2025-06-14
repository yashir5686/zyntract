
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
  question__title_slug: string; 
  difficulty: { level: number }; 
  question__content: string; 
}

interface LeetCodeProblemsResponse {
  [key: string]: LeetCodeProblemSource;
}

const mapLevelToDifficulty = (level: number | undefined): 'easy' | 'medium' | 'hard' => {
  if (level === 1) return 'easy';
  if (level === 2) return 'medium';
  if (level === 3) return 'hard';
  console.warn(`Unknown difficulty level: ${level}, defaulting to medium.`);
  return 'medium'; 
};

const getPointsForDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy': return 10;
    case 'medium': return 25;
    case 'hard': return 50;
    default: return 10;
  }
};

export async function fetchDailyProgrammingProblem(): Promise<DailyChallenge | null> {
  console.log('[fetchDailyProgrammingProblem] Initiating flow...');
  const result = await fetchLeetCodeProblemFlow({});
  if (!result) {
    console.log('[fetchDailyProgrammingProblem] Flow returned null.');
  } else {
    console.log('[fetchDailyProgrammingProblem] Flow returned a challenge:', result.id);
  }
  return result;
}

const fetchLeetCodeProblemFlow = ai.defineFlow(
  {
    name: 'fetchLeetCodeProblemFlow',
    inputSchema: z.object({}),
    outputSchema: DailyChallengeOutputSchema.nullable(),
  },
  async () => {
    console.log('[fetchLeetCodeProblemFlow] Starting to fetch problem.');
    try {
      const response = await fetch('https://raw.githubusercontent.com/noworneverev/leetcode-api/refs/heads/main/data/leetcode_questions.json');
      if (!response.ok) {
        console.error('[fetchLeetCodeProblemFlow] LeetCode JSON API request failed:', response.status, await response.text());
        console.log('[fetchLeetCodeProblemFlow] Returning null due to API request failure.');
        return null;
      }
      console.log('[fetchLeetCodeProblemFlow] API request successful.');

      const data: LeetCodeProblemsResponse = await response.json();
      const problemsArray = Object.values(data);
      console.log(`[fetchLeetCodeProblemFlow] Fetched ${problemsArray.length} problems in total from LeetCode JSON.`);

      if (!problemsArray || problemsArray.length === 0) {
        console.error('[fetchLeetCodeProblemFlow] LeetCode JSON API did not return problems or no problems found in array.');
        console.log('[fetchLeetCodeProblemFlow] Returning null due to no problems in array.');
        return null;
      }
      
      const suitableProblems = problemsArray.filter(p => 
        p.question_id && // Must have an ID
        p.question__title && // Must have a title
        p.question__content && // Must have content (not empty string)
        p.difficulty && typeof p.difficulty.level === 'number' // Must have difficulty object with a numeric level
      );
      console.log(`[fetchLeetCodeProblemFlow] Found ${suitableProblems.length} suitable problems after filtering.`);

      if (suitableProblems.length === 0) {
        console.warn('[fetchLeetCodeProblemFlow] No suitable programming problems found from LeetCode JSON based on filter.');
        console.log('[fetchLeetCodeProblemFlow] Returning null due to no suitable problems after filter.');
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * suitableProblems.length);
      const problem = suitableProblems[randomIndex];
      console.log(`[fetchLeetCodeProblemFlow] Randomly selected problem index: ${randomIndex}, ID: ${problem?.question_id}, Title: ${problem?.question__title}`);

      // This secondary check should ideally be covered by the filter, but kept for safety.
      if (!problem || !problem.question_id || !problem.question__title || !problem.question__content || !problem.difficulty || typeof problem.difficulty.level !== 'number') {
        console.error('[fetchLeetCodeProblemFlow] Selected problem is missing essential fields or has invalid difficulty. Problem data:', problem);
        console.log('[fetchLeetCodeProblemFlow] Returning null due to selected problem missing essential fields post-random selection.');
        return null;
      }

      const difficulty = mapLevelToDifficulty(problem.difficulty.level);
      const points = getPointsForDifficulty(difficulty);
      const problemId = `LC-${problem.question_id}`;

      const challengeResult: DailyChallenge = {
        id: problemId,
        title: problem.question__title,
        description: problem.question__content,
        difficulty: difficulty,
        points: points,
        date: new Date().toISOString().split('T')[0],
      };
      console.log('[fetchLeetCodeProblemFlow] Successfully formatted challenge:', challengeResult.id);
      return challengeResult;

    } catch (error) {
      console.error('[fetchLeetCodeProblemFlow] Error fetching or processing LeetCode problem:', error);
      console.log('[fetchLeetCodeProblemFlow] Returning null due to an exception.');
      return null;
    }
  }
);
