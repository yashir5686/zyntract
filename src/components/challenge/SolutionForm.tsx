
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Send, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ChallengeExample } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '../ui/separator';

interface SolutionFormProps {
  challengeId: string;
  userId: string;
  examples: ChallengeExample[];
  onSubmitSuccess: (pointsAwarded: number) => void;
}

// This is a mock submission function. In a real app, this would call a backend service for evaluation.
async function mockSubmitSolution(userId: string, challengeId: string, code: string, language: string): Promise<{ pointsAwarded: number }> {
  console.log('Submitting solution for user', userId, 'challenge', challengeId, 'language:', language, 'code:', code.substring(0, 100) + '...');
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
  
  if (code.trim() === "") {
    throw new Error("Code cannot be empty.");
  }
  // Simulate points based on code length or a keyword for demo purposes
  let points = 5;
  if (code.length > 50) points +=5;
  if (code.toLowerCase().includes("return") || code.toLowerCase().includes("print")) points += 5;

  return { pointsAwarded: Math.min(points, 15) }; // Max 15 for mock
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput?: string; // For real testing
  status: 'passed' | 'failed' | 'pending' | 'error';
  explanation?: string;
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
];

export default function SolutionForm({ challengeId, userId, examples, onSubmitSuccess }: SolutionFormProps) {
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize test results based on examples
    setTestResults(examples.map(ex => ({
      input: ex.input,
      expectedOutput: ex.output,
      explanation: ex.explanation,
      status: 'pending'
    })));
  }, [examples]);

  const handleRunTests = async () => {
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'Empty Code', description: 'Please write some code to test.' });
      return;
    }
    setIsRunningTests(true);
    setTestResults(prevResults => prevResults.map(r => ({ ...r, status: 'pending' })));

    // Simulate API call to test execution service
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock test results: for demo, alternate pass/fail if multiple examples, or pass if one.
    const newResults = examples.map((ex, index) => {
      const mockStatus = examples.length === 1 ? 'passed' : (index % 2 === 0 ? 'passed' : 'failed');
      return {
        input: ex.input,
        expectedOutput: ex.output,
        actualOutput: mockStatus === 'passed' ? ex.output : `Mocked different output for ${ex.input.substring(0,20)}...`,
        status: mockStatus,
        explanation: ex.explanation
      };
    });
    
    setTestResults(newResults);
    setIsRunningTests(false);
    toast({ title: 'Tests Finished', description: 'Review the results below.' });
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'Empty Code', description: 'Please provide your solution code.' });
      return;
    }
    setIsSubmitting(true);
    try {
      // In a real app, this would call a backend service for full evaluation.
      const result = await mockSubmitSolution(userId, challengeId, code, selectedLanguage);
      toast({ title: 'Solution Submitted!', description: `Your solution is being evaluated. Mock points: ${result.pointsAwarded}.` });
      onSubmitSuccess(result.pointsAwarded); // This updates local user stats for demo
      // Optionally clear code or reset state: setCode(''); setTestResults([]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'Could not submit solution.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitSolution} className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Code Your Solution</CardTitle>
          <CardDescription>Select your language, write your code, run tests against examples, and then submit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-foreground mb-1">
              Language
            </label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language" className="w-full md:w-[200px] bg-input border-border">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1">
              Your Code
            </label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// Start writing your ${LANGUAGES.find(l=>l.value === selectedLanguage)?.label || 'code'} here...`}
              rows={15}
              className="bg-input border-border focus:ring-primary font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Note: True syntax error highlighting is not available in this basic editor.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" onClick={handleRunTests} disabled={isRunningTests || isSubmitting} variant="outline">
              {isRunningTests ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run Tests
            </Button>
            <Button type="submit" disabled={isSubmitting || isRunningTests} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Solution
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.some(r => r.status !== 'pending') && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-md border ${
                result.status === 'passed' ? 'border-green-500 bg-green-500/10' :
                result.status === 'failed' ? 'border-red-500 bg-red-500/10' :
                result.status === 'error' ? 'border-yellow-500 bg-yellow-500/10' :
                'border-border bg-muted/50'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">
                    Example {index + 1}: {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                  </p>
                  {result.status === 'passed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {result.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                  {result.status === 'error' && <XCircle className="w-5 h-5 text-yellow-500" />}
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><strong>Input:</strong> <pre className="inline whitespace-pre-wrap bg-muted/30 p-1 rounded-sm">{result.input}</pre></p>
                  <p><strong>Expected Output:</strong> <pre className="inline whitespace-pre-wrap bg-muted/30 p-1 rounded-sm">{result.expectedOutput}</pre></p>
                  {result.status !== 'passed' && result.status !== 'pending' && result.actualOutput && (
                     <p><strong>Actual Output:</strong> <pre className="inline whitespace-pre-wrap bg-muted/30 p-1 rounded-sm">{result.actualOutput}</pre></p>
                  )}
                  {result.explanation && <p><strong>Explanation:</strong> {result.explanation}</p>}
                </div>
              </div>
            ))}
             {isRunningTests && testResults.every(r => r.status === 'pending') && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Running tests...
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  );
}
