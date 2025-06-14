'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface SolutionFormProps {
  challengeId: string;
  userId: string;
  onSubmitSuccess: (pointsAwarded: number) => void;
}

// This is a mock submission function. In a real app, this would call a backend service.
async function mockSubmitSolution(userId: string, challengeId: string, solution: string): Promise<{ pointsAwarded: number }> {
  console.log('Submitting solution for user', userId, 'challenge', challengeId, 'solution:', solution);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate some basic validation or processing
  if (solution.trim() === "") {
    throw new Error("Solution cannot be empty.");
  }
  if (solution.toLowerCase().includes("example")) { // dummy check
      return { pointsAwarded: 10 }; // Example points
  }
  return { pointsAwarded: 5 }; // Example points for a partial solution
}


export default function SolutionForm({ challengeId, userId, onSubmitSuccess }: SolutionFormProps) {
  const [solution, setSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solution.trim()) {
      toast({ variant: 'destructive', title: 'Empty Solution', description: 'Please provide your solution.' });
      return;
    }
    setIsSubmitting(true);
    try {
      // In a real app, this would call `submitChallengeSolution` from `@/lib/firebase/firestore`
      // which might then trigger a Firebase Function for evaluation.
      // For now, using a mock function:
      const result = await mockSubmitSolution(userId, challengeId, solution);
      
      toast({ title: 'Solution Submitted!', description: `You earned ${result.pointsAwarded} points.` });
      onSubmitSuccess(result.pointsAwarded);
      setSolution(''); // Clear textarea
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'Could not submit solution.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="solution" className="block text-sm font-medium text-foreground mb-1">
          Your Solution
        </label>
        <Textarea
          id="solution"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Enter your code or explanation here..."
          rows={10}
          className="bg-input border-border focus:ring-primary"
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
        {isSubmitting ? 'Submitting...' : <><Send className="mr-2 h-4 w-4" /> Submit Solution</>}
      </Button>
    </form>
  );
}
