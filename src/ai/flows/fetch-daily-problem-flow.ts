
'use server';
/**
 * @fileOverview Fetches a daily programming problem from a JSON source.
 *
 * - fetchDailyProgrammingProblem - A function that retrieves and formats a problem.
 * - DailyChallengeOutput - The return type (reusing existing DailyChallenge type from @/types).
 */

import type { DailyChallenge } from '@/types';

interface LeetCodeProblemDetail {
  questionId: string;
  questionFrontendId: string;
  title: string;
  content: string; // This is HTML
  difficulty: string; // "Easy", "Medium", "Hard"
  // topicTags: Array<{ name: string; slug: string; translatedName: string | null }>;
}

interface LeetCodeProblemWrapper {
  data: {
    question: LeetCodeProblemDetail;
  };
}

interface LeetCodeProblemsResponse {
  [key: string]: LeetCodeProblemWrapper; // Keys are problem IDs like "1", "2"
}

const mapApiDifficultyToEnum = (apiDifficulty: string): 'easy' | 'medium' | 'hard' => {
  const lowerCaseDifficulty = apiDifficulty.toLowerCase();
  if (lowerCaseDifficulty === 'easy') return 'easy';
  if (lowerCaseDifficulty === 'medium') return 'medium';
  if (lowerCaseDifficulty === 'hard') return 'hard';
  console.warn(`[mapApiDifficultyToEnum] Unknown API difficulty: ${apiDifficulty}, defaulting to medium.`);
  return 'medium'; // Default case
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
  console.log('[fetchDailyProgrammingProblem] Initiating problem fetch from GitHub JSON...');
  try {
    const response = await fetch('https://raw.githubusercontent.com/noworneverev/leetcode-api/refs/heads/main/data/leetcode_questions.json');
    if (!response.ok) {
      console.error('[fetchDailyProgrammingProblem] GitHub JSON API request failed:', response.status, await response.text());
      return null;
    }
    console.log('[fetchDailyProgrammingProblem] GitHub JSON API request successful.');

    const data: LeetCodeProblemsResponse = await response.json();
    const problemWrappersArray: LeetCodeProblemWrapper[] = Object.values(data);
    console.log(`[fetchDailyProgrammingProblem] Fetched ${problemWrappersArray.length} problems in total from GitHub JSON.`);

    if (!problemWrappersArray || problemWrappersArray.length === 0) {
      console.error('[fetchDailyProgrammingProblem] GitHub JSON API did not return problems or no problems found in array.');
      return null;
    }

    const suitableProblems = problemWrappersArray.filter(wrapper =>
      wrapper.data &&
      wrapper.data.question &&
      wrapper.data.question.questionId &&
      wrapper.data.question.title && wrapper.data.question.title.trim() !== '' &&
      wrapper.data.question.content && wrapper.data.question.content.trim() !== '' &&
      wrapper.data.question.difficulty && ['Easy', 'Medium', 'Hard'].includes(wrapper.data.question.difficulty)
    ).map(wrapper => wrapper.data.question);

    console.log(`[fetchDailyProgrammingProblem] Found ${suitableProblems.length} suitable problems after filtering.`);

    if (suitableProblems.length === 0) {
      console.warn('[fetchDailyProgrammingProblem] No suitable programming problems found from GitHub JSON based on current filter criteria.');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * suitableProblems.length);
    const problem = suitableProblems[randomIndex];
    console.log(`[fetchDailyProgrammingProblem] Randomly selected problem index: ${randomIndex}, ID: ${problem?.questionId}, Title: ${problem?.title}`);

    if (!problem) { // Should not happen if suitableProblems has items, but as a safeguard.
        console.error('[fetchDailyProgrammingProblem] Randomly selected problem is undefined or null.');
        return null;
    }

    const difficulty = mapApiDifficultyToEnum(problem.difficulty);
    const points = getPointsForDifficulty(difficulty);
    const problemId = `Leet-${problem.questionId}`;

    const challengeResult: DailyChallenge = {
      id: problemId,
      title: problem.title,
      description: problem.content, // HTML content
      difficulty: difficulty,
      points: points,
      date: new Date().toISOString().split('T')[0], // Current date
    };
    console.log('[fetchDailyProgrammingProblem] Successfully formatted challenge:', challengeResult.id);
    return challengeResult;

  } catch (error) {
    console.error('[fetchDailyProgrammingProblem] Error fetching or processing GitHub JSON problem:', error);
    return null;
  }
}
