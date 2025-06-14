
'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Send, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChallengeExample } from '@/types';
import dynamic from 'next/dynamic';

// Dynamically import MonacoEditorComponent to ensure it's client-side only
const MonacoEditorComponent = dynamic(() => import('./MonacoEditorComponent'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});


interface SolutionFormProps {
  challengeId: string;
  userId: string;
  examples: ChallengeExample[];
  onSubmitSuccess: (pointsAwarded: number) => void;
}

interface TestResult {
  id: string; // example index or a unique ID
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: 'pending' | 'passed' | 'failed' | 'error';
  errorDetails?: string;
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
];

async function mockSubmitSolution(userId: string, challengeId: string, code: string, language: string): Promise<{ pointsAwarded: number }> {
  console.log('Mock submission for user', userId, 'challenge', challengeId, 'language', language);
  console.log('Code submitted:', code);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { pointsAwarded: 5 }; // Mock points
}

export default function SolutionForm({ challengeId, userId, examples, onSubmitSuccess }: SolutionFormProps) {
  const [code, setCode] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0].value);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize test results based on examples
    setTestResults(examples.map((ex, index) => ({
      id: `ex-${index}`,
      input: ex.input,
      expectedOutput: ex.output,
      actualOutput: '',
      status: 'pending',
    })));
  }, [examples]);

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleRunTests = async () => {
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'Empty Code', description: 'Please write some code before running tests.' });
      return;
    }
    setIsRunningTests(true);
    const currentTestResults: TestResult[] = examples.map((ex, index) => ({
      id: `ex-${index}`,
      input: ex.input,
      expectedOutput: ex.output,
      actualOutput: 'Running...',
      status: 'pending',
    }));
    setTestResults(currentTestResults);

    // Simulate test execution (mocked)
    for (let i = 0; i < examples.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      const example = examples[i];
      // Mock logic:
      const isPass = Math.random() > 0.3; // 70% chance of passing
      currentTestResults[i].status = isPass ? 'passed' : 'failed';
      currentTestResults[i].actualOutput = isPass ? example.output : `Mocked different output for input: ${example.input}`;
      if (!isPass && Math.random() > 0.7) { // 30% chance of error for failed tests
        currentTestResults[i].status = 'error';
        currentTestResults[i].actualOutput = 'Mocked runtime error';
        currentTestResults[i].errorDetails = 'SyntaxError: Unexpected token or similar mock error.';
      }
      setTestResults([...currentTestResults]); // Update state progressively
    }
    setIsRunningTests(false);
    toast({ title: 'Tests Completed (Mock)', description: 'Check the results below.' });
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'Empty Code', description: 'Please write your solution before submitting.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await mockSubmitSolution(userId, challengeId, code, selectedLanguage);
      toast({ title: 'Solution Submitted (Mock)!', description: `Mock system acknowledged an attempt. Points: ${result.pointsAwarded}.` });
      onSubmitSuccess(result.pointsAwarded);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission Failed (Mock)', description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitSolution} className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Code Your Solution</CardTitle>
          <CardDescription>Select your language and write your code in the editor below. Use the "Run Tests" button to check against examples.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <label htmlFor="language-select" className="block text-sm font-medium text-muted-foreground mb-1">Language</label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language-select" className="w-[200px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MonacoEditorComponent
            language={selectedLanguage.toLowerCase()}
            value={code}
            onChange={handleCodeChange}
            height="500px"
          />

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              onClick={handleRunTests}
              disabled={isRunningTests || isSubmitting}
              variant="outline"
            >
              {isRunningTests ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run Tests (Mock)
            </Button>
            <Button
              type="submit"
              disabled={isRunningTests || isSubmitting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Final Solution (Mock)
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Test Results (Mocked)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResults.map((result, index) => (
              <div key={result.id} className="p-3 border rounded-md bg-card-foreground/5">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">Test Case #{index + 1}</h4>
                  {result.status === 'pending' && <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Pending</Badge>}
                  {result.status === 'passed' && <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Passed</Badge>}
                  {result.status === 'failed' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>}
                  {result.status === 'error' && <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground font-medium">Input:</p>
                    <pre className="p-1.5 bg-muted rounded-sm text-foreground whitespace-pre-wrap break-all">{result.input || 'N/A'}</pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Expected Output:</p>
                    <pre className="p-1.5 bg-muted rounded-sm text-foreground whitespace-pre-wrap break-all">{result.expectedOutput || 'N/A'}</pre>
                  </div>
                </div>
                {result.status !== 'pending' && (
                  <div className="mt-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Actual Output:</p>
                    <pre className={`p-1.5 rounded-sm whitespace-pre-wrap break-all text-xs ${result.status === 'error' ? 'bg-destructive/10 text-destructive-foreground' : 'bg-muted text-foreground'}`}>
                      {result.actualOutput || (result.status === 'error' ? 'No output due to error.' : 'No output.')}
                    </pre>
                  </div>
                )}
                 {result.status === 'error' && result.errorDetails && (
                  <div className="mt-1.5">
                    <p className="text-xs text-red-500 font-medium">Error Details:</p>
                    <pre className="p-1.5 bg-destructive/10 text-destructive-foreground rounded-sm whitespace-pre-wrap break-all text-xs">{result.errorDetails}</pre>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </form>
  );
}
