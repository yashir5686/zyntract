
'use server';
/**
 * @fileOverview Fetches a daily programming problem, utilizing a Firestore cache.
 *
 * - fetchDailyProgrammingProblem - A function that retrieves and formats a problem,
 *   checking cache first, then fetching from external source if needed.
 * - DailyChallengeOutput - The return type (reusing existing DailyChallenge type from @/types).
 */

import type { DailyChallenge, ChallengeExample } from '@/types';
import { getCachedDailyProblem, cacheDailyProblem } from '@/lib/firebase/firestore';

interface LeetCodeProblemDetail {
  questionId: string;
  questionFrontendId: string;
  title: string;
  content: string; // This is HTML
  difficulty: string; // "Easy", "Medium", "Hard"
}

interface LeetCodeProblemWrapper {
  data: {
    question: LeetCodeProblemDetail;
  };
}

interface LeetCodeProblemsResponse {
  [key: string]: LeetCodeProblemWrapper; 
}

const mapApiDifficultyToEnum = (apiDifficulty: string): 'easy' | 'medium' | 'hard' => {
  const lowerCaseDifficulty = apiDifficulty.toLowerCase();
  if (lowerCaseDifficulty === 'easy') return 'easy';
  if (lowerCaseDifficulty === 'medium') return 'medium';
  if (lowerCaseDifficulty === 'hard') return 'hard';
  console.warn(`[mapApiDifficultyToEnum] Unknown API difficulty: ${apiDifficulty}, defaulting to medium.`);
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

const parseExamplesFromHtml = (htmlContent: string): ChallengeExample[] => {
  const examples: ChallengeExample[] = [];
  if (!htmlContent || typeof htmlContent !== 'string') {
    return examples;
  }
  try {
    const exampleRegex = /<strong class="example">Example \d+:<\/strong>.*?<pre>(.*?)<\/pre>/gs;
    let match;
    while ((match = exampleRegex.exec(htmlContent)) !== null) {
      const preContent = match[1];
      let input = '';
      let output = '';
      let explanation = '';

      const inputMatch = preContent.match(/<strong>Input:<\/strong>\s*(.*?)(?=\n<strong>Output:<\/strong>|<\/pre>)/is);
      if (inputMatch) input = inputMatch[1].replace(/<[^>]+>/g, '').trim();

      const outputMatch = preContent.match(/<strong>Output:<\/strong>\s*(.*?)(?=\n<strong>Explanation:<\/strong>|<\/pre>)/is);
      if (outputMatch) output = outputMatch[1].replace(/<[^>]+>/g, '').trim();
      
      const explanationMatch = preContent.match(/<strong>Explanation:<\/strong>\s*(.*?)(?=\n<\/pre>|<\/pre>)/is);
      if (explanationMatch) explanation = explanationMatch[1].replace(/<[^>]+>/g, '').trim();
      
      if (!output && input && preContent.includes('Output:')) {
        const genericOutputMatch = preContent.substring(preContent.indexOf('Output:') + 'Output:'.length).match(/\s*(.*?)(?=\n<strong>Explanation:<\/strong>|<\/pre>)/is);
        if(genericOutputMatch) output = genericOutputMatch[1].replace(/<[^>]+>/g, '').trim();
      }

      if (input && output) {
        examples.push({ input, output, explanation: explanation || undefined });
      }
    }
  } catch (error) {
    console.error("[parseExamplesFromHtml] Error parsing examples:", error);
  }
  return examples;
};

async function fetchFromExternalSource(): Promise<DailyChallenge | null> {
  console.log('[fetchFromExternalSource] Initiating problem fetch from GitHub JSON...');
  try {
    const response = await fetch('https://raw.githubusercontent.com/noworneverev/leetcode-api/refs/heads/main/data/leetcode_questions.json');
    if (!response.ok) {
      console.error('[fetchFromExternalSource] GitHub JSON API request failed:', response.status, await response.text());
      return null;
    }
    const data: LeetCodeProblemsResponse = await response.json();
    const problemWrappersArray: LeetCodeProblemWrapper[] = Object.values(data);

    if (!problemWrappersArray || problemWrappersArray.length === 0) {
      console.error('[fetchFromExternalSource] GitHub JSON API did not return problems or no problems found.');
      return null;
    }

    const suitableProblems = problemWrappersArray.filter(wrapper =>
      wrapper.data && wrapper.data.question && wrapper.data.question.questionId &&
      wrapper.data.question.title?.trim() && wrapper.data.question.content?.trim() &&
      wrapper.data.question.difficulty && ['Easy', 'Medium', 'Hard'].includes(wrapper.data.question.difficulty)
    ).map(wrapper => wrapper.data.question);

    if (suitableProblems.length === 0) {
      console.warn('[fetchFromExternalSource] No suitable programming problems found from GitHub JSON.');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * suitableProblems.length);
    const problem = suitableProblems[randomIndex];

    if (!problem) {
        console.error('[fetchFromExternalSource] Randomly selected problem is undefined or null.');
        return null;
    }
    
    const difficulty = mapApiDifficultyToEnum(problem.difficulty);
    const points = getPointsForDifficulty(difficulty);
    // Ensure the problem ID is unique and identifiable, prefixing to avoid collision if other sources are added.
    const problemId = `Leet-${problem.questionId}`; 
    const examples = parseExamplesFromHtml(problem.content);
    const todayStr = new Date().toISOString().split('T')[0];

    const challengeResult: DailyChallenge = {
      id: problemId,
      title: problem.title,
      description: problem.content,
      difficulty: difficulty,
      points: points,
      date: todayStr, // Set problem's active date to today
      examples,
    };
    console.log('[fetchFromExternalSource] Successfully formatted challenge:', challengeResult.id, 'for date:', todayStr);
    return challengeResult;

  } catch (error) {
    console.error('[fetchFromExternalSource] Error fetching or processing GitHub JSON problem:', error);
    return null;
  }
}

export async function fetchDailyProgrammingProblem(): Promise<DailyChallenge | null> {
  console.log('[fetchDailyProgrammingProblem] Attempting to fetch daily problem...');
  
  const cachedProblem = await getCachedDailyProblem();
  if (cachedProblem) {
    console.log('[fetchDailyProgrammingProblem] Returning cached problem for today:', cachedProblem.id);
    return cachedProblem;
  }

  console.log('[fetchDailyProgrammingProblem] No valid cache for today. Fetching new problem from external source.');
  const newProblem = await fetchFromExternalSource();

  if (newProblem) {
    // newProblem.date is already set to today by fetchFromExternalSource
    await cacheDailyProblem(newProblem);
    console.log('[fetchDailyProgrammingProblem] New problem fetched and cached:', newProblem.id);
    return newProblem;
  } else {
    console.error('[fetchDailyProgrammingProblem] Failed to fetch new problem from external source. No problem available for today.');
    return null;
  }
}
