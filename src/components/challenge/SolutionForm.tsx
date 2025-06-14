
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Send, Play, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import type { ChallengeExample } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SolutionFormProps {
  challengeId: string;
  userId: string;
  examples: ChallengeExample[];
  onSubmitSuccess: (pointsAwarded: number) => void;
}

// This is a mock submission function for the main "Submit Solution" button.
// Actual judging for final submission would typically involve a more robust backend.
async function mockSubmitSolution(userId: string, challengeId: string, code: string, language: string): Promise<{ pointsAwarded: number }> {
  console.log('Submitting final solution for user', userId, 'challenge', challengeId, 'language:', language);
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (code.trim() === "") {
    throw new Error("Code cannot be empty.");
  }
  let points = 5;
  if (code.length > 50) points +=5;
  if (code.toLowerCase().includes("return") || code.toLowerCase().includes("print")) points += 5;
  return { pointsAwarded: Math.min(points, 15) };
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  stdout?: string;
  stderr?: string;
  build_stdout?: string;
  build_stderr?:string;
  exit_code?: number;
  build_exit_code?: number;
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

// Ensure you have NEXT_PUBLIC_PAIZA_API_KEY=guest (or your actual key) in your .env.local file
const PAIZA_API_BASE_URL = 'https://api.paiza.io';

export default function SolutionForm({ challengeId, userId, examples, onSubmitSuccess }: SolutionFormProps) {
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
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
    const apiKey = process.env.NEXT_PUBLIC_PAIZA_API_KEY || 'guest';
    if (apiKey === 'guest' && process.env.NODE_ENV === 'production') {
        console.warn("Using guest API key for Paiza.IO in production. This is not recommended.");
    }


    const initialResults = examples.map(ex => ({
      input: ex.input,
      expectedOutput: ex.output,
      explanation: ex.explanation,
      status: 'pending',
      actualOutput: '',
      stdout: '',
      stderr: '',
      build_stderr: '',
      build_stdout: '',
    } as TestResult));
    setTestResults(initialResults);

    const currentTestResults: TestResult[] = [...initialResults];

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      currentTestResults[i] = { ...currentTestResults[i], status: 'pending' };
      setTestResults([...currentTestResults]); // Update UI to show this test is running

      try {
        // 1. Create runner
        const createPayload = new URLSearchParams();
        createPayload.append('api_key', apiKey);
        createPayload.append('source_code', code);
        createPayload.append('language', selectedLanguage);
        createPayload.append('input', example.input);

        const createResponse = await fetch(`${PAIZA_API_BASE_URL}/runners/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: createPayload,
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({ error: 'Paiza API Error (create): Invalid API response format' }));
            throw new Error(errorData.error || `Paiza API Error (create): ${createResponse.status}`);
        }

        const createResult = await createResponse.json();
        if (createResult.error) {
             throw new Error(`Paiza API Error (create): ${createResult.error_description || createResult.error}`);
        }
        const runnerId = createResult.id;

        // 2. Poll for details
        let status = '';
        let attempts = 0;
        const maxAttempts = 15; // Poll for ~15 seconds
        let detailsResult: any;

        while (status !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 sec

            const detailsParams = new URLSearchParams({
                api_key: apiKey,
                id: runnerId,
            });
            const detailsResponse = await fetch(`${PAIZA_API_BASE_URL}/runners/get_details?${detailsParams.toString()}`);
            
            if (!detailsResponse.ok) {
                const errorData = await detailsResponse.json().catch(() => ({ error: 'Paiza API Error (details): Invalid API response format' }));
                throw new Error(errorData.error || `Paiza API Error (details): ${detailsResponse.status}`);
            }

            detailsResult = await detailsResponse.json();
            status = detailsResult.status;
            attempts++;
        }

        currentTestResults[i].stdout = detailsResult.stdout || '';
        currentTestResults[i].stderr = detailsResult.stderr || '';
        currentTestResults[i].build_stdout = detailsResult.build_stdout || '';
        currentTestResults[i].build_stderr = detailsResult.build_stderr || '';
        currentTestResults[i].exit_code = detailsResult.exit_code;
        currentTestResults[i].build_exit_code = detailsResult.build_exit_code;
        
        if (status !== 'completed') {
            currentTestResults[i].status = 'error';
            currentTestResults[i].actualOutput = 'Error: Execution timed out or did not complete on Paiza.IO.';
        } else if (detailsResult.build_exit_code !== 0 || detailsResult.build_stderr) {
            currentTestResults[i].status = 'error';
            currentTestResults[i].actualOutput = `Build Failed:\n${detailsResult.build_stderr || detailsResult.build_stdout || 'Unknown build error'}`;
        } else if (detailsResult.exit_code !== 0 || detailsResult.stderr) {
             currentTestResults[i].status = 'error';
             currentTestResults[i].actualOutput = `Runtime Error:\n${detailsResult.stderr || 'Unknown runtime error'}`;
        } else {
            currentTestResults[i].actualOutput = (detailsResult.stdout || '').trimEnd(); // Trim only trailing newlines/spaces for comparison
            const expected = example.output.trimEnd();
            if (currentTestResults[i].actualOutput === expected) {
                currentTestResults[i].status = 'passed';
            } else {
                currentTestResults[i].status = 'failed';
            }
        }
      } catch (error: any) {
        console.error(`Error running test case ${i + 1}:`, error);
        currentTestResults[i].status = 'error';
        currentTestResults[i].actualOutput = `Client-side Error: ${error.message}`;
      }
      setTestResults([...currentTestResults]); // Update UI after each test case finishes
    }

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
      const result = await mockSubmitSolution(userId, challengeId, code, selectedLanguage);
      toast({ title: 'Solution Submitted!', description: `Mock evaluation completed. Mock points: ${result.pointsAwarded}.` });
      onSubmitSuccess(result.pointsAwarded);
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
          <CardDescription>Select language, write code, run tests, then submit. (Paiza.IO API key: {process.env.NEXT_PUBLIC_PAIZA_API_KEY ? 'Loaded' : 'Not Found - Set NEXT_PUBLIC_PAIZA_API_KEY in .env.local'})</CardDescription>
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
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" onClick={handleRunTests} disabled={isRunningTests || isSubmitting} variant="outline">
              {isRunningTests ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run Tests
            </Button>
            <Button type="submit" disabled={isSubmitting || isRunningTests} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Solution (Mock)
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.some(r => r.status !== 'pending' || isRunningTests) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Test Results</CardTitle>
            {isRunningTests && <CardDescription className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tests are running...</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-md border ${
                result.status === 'passed' ? 'border-green-500 bg-green-500/10' :
                result.status === 'failed' ? 'border-red-500 bg-red-500/10' :
                result.status === 'error' ? 'border-yellow-500 bg-yellow-500/10' :
                'border-border bg-muted/50' // Pending
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">
                    Example {index + 1}: {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                  </p>
                  {result.status === 'passed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {result.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                  {result.status === 'error' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                  {result.status === 'pending' && isRunningTests && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                </div>
                <div className="text-xs space-y-1 ">
                  <p className="text-muted-foreground"><strong>Input:</strong></p>
                  <pre className="whitespace-pre-wrap bg-muted/30 p-1 rounded-sm font-mono text-foreground">{result.input}</pre>
                  
                  <p className="text-muted-foreground mt-1"><strong>Expected Output:</strong></p>
                  <pre className="whitespace-pre-wrap bg-muted/30 p-1 rounded-sm font-mono text-foreground">{result.expectedOutput}</pre>
                  
                  {result.status !== 'pending' && result.actualOutput !== undefined && (
                     <>
                        <p className="text-muted-foreground mt-1"><strong>Actual Output:</strong></p>
                        <pre className={`whitespace-pre-wrap p-1 rounded-sm font-mono ${result.status === 'error' ? 'text-red-500 bg-red-500/5' : 'text-foreground bg-muted/30'}`}>{result.actualOutput || (result.status !== 'error' ? '(No output)' : '')}</pre>
                     </>
                  )}
                  {result.explanation && <p className="text-muted-foreground mt-1"><strong>Problem Explanation for Example:</strong> {result.explanation}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </form>
  );
}
