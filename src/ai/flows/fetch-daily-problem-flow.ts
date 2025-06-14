
'use server';
/**
 * @fileOverview Fetches a daily programming problem from a JSON source.
 *
 * - fetchDailyProgrammingProblem - A function that retrieves and formats a problem.
 * - DailyChallengeOutput - The return type (reusing existing DailyChallenge type from @/types).
 */

import type { DailyChallenge, ChallengeExample } from '@/types';

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
      if (inputMatch) {
        input = inputMatch[1].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags and trim
      }

      const outputMatch = preContent.match(/<strong>Output:<\/strong>\s*(.*?)(?=\n<strong>Explanation:<\/strong>|<\/pre>)/is);
      if (outputMatch) {
        output = outputMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      
      const explanationMatch = preContent.match(/<strong>Explanation:<\/strong>\s*(.*?)(?=\n<\/pre>|<\/pre>)/is);
      if (explanationMatch) {
        explanation = explanationMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      
      // Fallback if explanation is not explicitly tagged but output is
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

    if (!problem || !problem.title || !problem.content || !problem.difficulty) { 
        console.error('[fetchDailyProgrammingProblem] Randomly selected problem is undefined, null, or missing critical fields (title, content, difficulty). Problem:', problem);
        return null;
    }

    const difficulty = mapApiDifficultyToEnum(problem.difficulty);
    const points = getPointsForDifficulty(difficulty);
    const problemId = `Leet-${problem.questionId}`;
    const examples = parseExamplesFromHtml(problem.content);

    const challengeResult: DailyChallenge = {
      id: problemId,
      title: problem.title,
      description: problem.content, // HTML content
      difficulty: difficulty,
      points: points,
      date: new Date().toISOString().split('T')[0], // Current date
      examples,
    };
    console.log('[fetchDailyProgrammingProblem] Successfully formatted challenge:', challengeResult.id, 'with', examples.length, 'examples.');
    return challengeResult;

  } catch (error) {
    console.error('[fetchDailyProgrammingProblem] Error fetching or processing GitHub JSON problem:', error);
    return null;
  }
}
