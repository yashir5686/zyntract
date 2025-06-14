
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Info, CheckCircle, Clock, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserDailyChallengeSubmission } from '@/types';
import dynamic from 'next/dynamic';
import { submitDailyChallengeSolution } from '@/lib/firebase/firestore';

const MonacoEditorComponent = dynamic(() => import('./MonacoEditorComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] md:h-[400px] bg-muted rounded-md animate-pulse" />,
});

interface SolutionFormProps {
  challengeId: string; // Actual problem ID (e.g., Leet-123)
  dailyProblemDate: string; // YYYY-MM-DD string for Firestore path
  userId: string;
  existingSubmission: UserDailyChallengeSubmission | null;
  onSolutionSubmitted: (submission: UserDailyChallengeSubmission) => void;
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript (Node.js)' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
];

export default function SolutionForm({ 
  challengeId, 
  dailyProblemDate, 
  userId, 
  existingSubmission, 
  onSolutionSubmitted 
}: SolutionFormProps) {
  const [code, setCode] = useState<string>(existingSubmission?.code || '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(existingSubmission?.language || LANGUAGES[0].value);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const isLocked = !!existingSubmission;

  useEffect(() => {
    if (existingSubmission) {
      setCode(existingSubmission.code);
      setSelectedLanguage(existingSubmission.language);
    } else {
      // Reset if no existing submission or if challenge changes
      setCode('');
      setSelectedLanguage(LANGUAGES[0].value);
    }
  }, [existingSubmission]);

  const handleCodeChange = (value: string | undefined) => {
    if (!isLocked) {
      setCode(value || '');
    }
  };

  const handleLanguageChange = (value: string) => {
    if (!isLocked) {
      setSelectedLanguage(value);
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast({ variant: 'destructive', title: 'Already Submitted', description: 'You have already submitted a solution for this challenge.' });
      return;
    }
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'Empty Code', description: 'Please write your solution before submitting.' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Pass dailyProblemDate to the submission function
      const submissionResult = await submitDailyChallengeSolution(
        userId, 
        dailyProblemDate, 
        challengeId, 
        code, 
        selectedLanguage
      );
      toast({ title: 'Solution Submitted!', description: 'Your solution is now under review.' });
      onSolutionSubmitted(submissionResult); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadge = (status: UserDailyChallengeSubmission['status']) => {
    switch (status) {
      case 'review':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> In Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><Info className="w-3 h-3 mr-1" /> Rejected</Badge>; 
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <form onSubmit={handleSubmitSolution} className="mt-8 space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <CardTitle className="font-headline text-xl mb-2 sm:mb-0">
              {isLocked ? "Your Submission" : "Code Your Solution"}
            </CardTitle>
            {existingSubmission && getStatusBadge(existingSubmission.status)}
          </div>
          {!isLocked && <CardDescription>Select language, write your code, and submit for review.</CardDescription>}
          {isLocked && existingSubmission?.adminNotes && (
            <div className="mt-2 p-3 bg-muted/50 rounded-md border border-border">
                <p className="text-sm font-semibold text-foreground flex items-center">
                    <Edit3 className="w-4 h-4 mr-2"/> Admin Feedback:
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{existingSubmission.adminNotes}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <label htmlFor="language-select" className="block text-sm font-medium text-muted-foreground mb-1">Language</label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={isLocked}>
              <SelectTrigger id="language-select" className="w-full sm:w-[200px]">
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
            height="300px"
            options={{ 
              readOnly: isLocked,
              minimap: { enabled: !isLocked }
            }}
          />
          
          {!isLocked && (
            <Button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Solution for Review
            </Button>
          )}
          {isLocked && (
             <p className="text-sm text-muted-foreground flex items-center">
                <Info className="w-4 h-4 mr-2"/> Your solution has been submitted and is currently locked.
             </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

