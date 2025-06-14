'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Send, AlertCircle, CheckCircle, XCircle, Loader2, Info, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChallengeExample } from '@/types';
import dynamic from 'next/dynamic';
import { executeCodeAction, type PaizaExecutionResult } from '@/actions/runCodeAction';

const MonacoEditorComponent = dynamic(() => import('./MonacoEditorComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-muted rounded-md animate-pulse" />,
});

interface SolutionFormProps {
  challengeId: string;
  userId: string;
  examples: ChallengeExample[];
  onSubmitSuccess: (pointsAwarded: number) => void;
}

interface TestResult {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  status: 'pending' | 'passed' | 'failed' | 'error' | 'running' | 'compiling' | 'timeout' | 'api_error' | 'service_unavailable';
  errorDetails?: string | null;
  exitCode?: number | null;
  buildExitCode?: number | null;
  paizaStatus?: string | null;
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript (Node.js)' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
];

async function mockSubmitSolution(userId: string, challengeId: string, code: string, language: string): Promise<{ pointsAwarded: number }> {
  console.log('Mock submission for user', userId, 'challenge', challengeId, 'language', language);
  console.log('Code submitted:', code);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { pointsAwarded: 5 };
}

export default function SolutionForm({ challengeId, userId, examples, onSubmitSuccess }: SolutionFormProps) {
  const [code, setCode] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0].value);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("SolutionForm examples received:", examples);
    setTestResults(examples.map((ex, index) => ({
      id: `ex-${index}`,
      input: ex.input,
      expectedOutput: ex.output,
      actualOutput: null,
      status: 'pending',
      errorDetails: null,
      exitCode: null,
      buildExitCode: null,
      paizaStatus: null,
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
      actualOutput: 'Executing...',
      status: 'running',
      errorDetails: null,
      exitCode: null,
      buildExitCode: null,
      paizaStatus: 'running',
    }));
    setTestResults([...currentTestResults]);

    const apiKey = process.env.NEXT_PUBLIC_PAIZA_API_KEY;
    console.log('[SolutionForm] Using Paiza.IO API Key for Server Action:', apiKey ? 'configured key (hidden)' : 'not configured (will use guest or fail)');


    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      const paizaLanguage = selectedLanguage;
      
      try {
        const result: PaizaExecutionResult = await executeCodeAction(paizaLanguage, code, example.input);
        
        currentTestResults[i].paizaStatus = result.status || 'unknown';
        currentTestResults[i].exitCode = result.exit_code;
        currentTestResults[i].buildExitCode = result.build_exit_code;

        if (result.status === 'error_service_unavailable') {
          currentTestResults[i].status = 'service_unavailable';
          currentTestResults[i].actualOutput = 'Service Unavailable';
          currentTestResults[i].errorDetails = result.error || result.message || 'Code execution service is temporarily unavailable.';
        } else if (result.error || result.status === 'error_package_level' || result.status === 'error_exception') {
          currentTestResults[i].status = 'api_error';
          currentTestResults[i].actualOutput = 'API/Service Error';
          currentTestResults[i].errorDetails = result.error || result.message || 'Failed to communicate with execution engine.';
        } else if (result.build_stderr || result.build_result === 'failure') {
          currentTestResults[i].status = 'error';
          currentTestResults[i].actualOutput = 'Compilation Error';
          currentTestResults[i].errorDetails = result.build_stderr || 'Build failed.';
        } else if (result.stderr) {
          currentTestResults[i].status = 'error';
          currentTestResults[i].actualOutput = 'Runtime Error';
          currentTestResults[i].errorDetails = result.stderr;
        } else if (result.status === 'completed' && result.result === 'timeout') {
            currentTestResults[i].status = 'timeout';
            currentTestResults[i].actualOutput = 'Execution Timed Out';
            currentTestResults[i].errorDetails = 'Your solution took too long to execute.';
        } else if (result.status === 'completed') {
          const actual = result.stdout ? result.stdout.trim() : '';
          currentTestResults[i].actualOutput = result.stdout;
          if (actual === example.output.trim()) {
            currentTestResults[i].status = 'passed';
          } else {
            currentTestResults[i].status = 'failed';
          }
        } else if (result.status === 'running' || result.status === 'compiling') {
          currentTestResults[i].status = result.status as 'running' | 'compiling';
          currentTestResults[i].actualOutput = `Status: ${result.status}`;
          currentTestResults[i].errorDetails = `The code is still processing (status: ${result.status}).`;
        } else {
          currentTestResults[i].status = 'error';
          currentTestResults[i].actualOutput = `Unexpected Status: ${result.status || 'N/A'}`;
          currentTestResults[i].errorDetails = `An unexpected status was returned: ${result.status}. Full result: ${JSON.stringify(result)}`;
        }
      } catch (e: any) {
        console.error("Error calling executeCodeAction from client:", e);
        currentTestResults[i].status = 'api_error';
        currentTestResults[i].actualOutput = 'Client Error';
        currentTestResults[i].errorDetails = e.message || 'Failed to run test due to a client-side error calling the action.';
      }
      setTestResults([...currentTestResults]);
    }
    setIsRunningTests(false);
    toast({ title: 'Tests Completed', description: 'Check the results below. Code execution service might be temporarily unavailable.' });
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'Empty Code', description: 'Please write your solution before submitting.' });
      return;
    }
    setIsSubmitting(true);
    const paizaLanguage = selectedLanguage;
    try {
      const result = await mockSubmitSolution(userId, challengeId, code, paizaLanguage);
      toast({ title: 'Solution Submitted (Mock)!', description: `Mock system acknowledged an attempt. Points: ${result.pointsAwarded}.` });
      onSubmitSuccess(result.pointsAwarded);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission Failed (Mock)', description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getResultBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Pending</Badge>;
      case 'passed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Passed</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'error': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      case 'api_error': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600"><AlertCircle className="w-3 h-3 mr-1" /> API Error</Badge>;
      case 'service_unavailable': return <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700"><AlertCircle className="w-3 h-3 mr-1" /> Service Unavailable</Badge>;
      case 'timeout': return <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Timeout</Badge>;
      case 'running': return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600"><Info className="w-3 h-3 mr-1" /> Running</Badge>;
      case 'compiling': return <Badge variant="secondary" className="bg-purple-500 hover:bg-purple-600"><Info className="w-3 h-3 mr-1" /> Compiling</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };


  return (
    <form onSubmit={handleSubmitSolution} className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Code Your Solution</CardTitle>
          <CardDescription>Select language, write code, and run tests. Code execution service may be temporarily unavailable.</CardDescription>
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
            language={selectedLanguage}
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
              Run Tests
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
            <CardTitle className="font-headline text-lg">Test Results</CardTitle>
            <CardDescription>Results from executing your code against example cases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResults.map((result, index) => (
              <div key={result.id} className="p-3 border rounded-md bg-card-foreground/5">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">Test Case #{index + 1}</h4>
                  {getResultBadge(result.status)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mt-2">
                  <div>
                    <p className="text-muted-foreground font-medium">Input:</p>
                    <pre className="p-1.5 bg-muted rounded-sm text-foreground whitespace-pre-wrap break-all">{result.input || 'N/A'}</pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Expected Output:</p>
                    <pre className="p-1.5 bg-muted rounded-sm text-foreground whitespace-pre-wrap break-all">{result.expectedOutput || 'N/A'}</pre>
                  </div>
                </div>
                {(result.status !== 'pending' ) && (
                  <div className="mt-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Actual Output (stdout):</p>
                    <pre className={`p-1.5 rounded-sm whitespace-pre-wrap break-all text-xs ${result.status === 'error' || result.status === 'api_error' || result.status === 'service_unavailable' ? 'bg-destructive/10 text-destructive-foreground' : 'bg-muted text-foreground'}`}>
                      {result.actualOutput === null ? (result.status === 'passed' ? result.expectedOutput : 'No output / Not available') : result.actualOutput}
                    </pre>
                  </div>
                )}
                 {(result.errorDetails) && (
                  <div className="mt-1.5">
                    <p className="text-xs text-destructive font-medium">Error Details (stderr/build_stderr/info):</p>
                    <pre className="p-1.5 bg-destructive/10 text-destructive-foreground rounded-sm whitespace-pre-wrap break-all text-xs">{result.errorDetails}</pre>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                    {result.paizaStatus && <span>Paiza Status: {result.paizaStatus} | </span>}
                    {result.exitCode !== null && <span>Exit Code: {result.exitCode} | </span>}
                    {result.buildExitCode !== null && <span>Build Exit Code: {result.buildExitCode}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </form>
  );
}
