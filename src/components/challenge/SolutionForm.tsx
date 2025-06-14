
'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SolutionFormProps {
  challengeId: string;
  userId: string;
  // examples prop removed as it's no longer used for client-side testing
  onSubmitSuccess: (pointsAwarded: number) => void;
}

// Mock submission function remains as we can't get code from iframe
async function mockSubmitSolution(userId: string, challengeId: string): Promise<{ pointsAwarded: number }> {
  console.log('Mock submission for user', userId, 'challenge', challengeId, '. Code from iframe is not directly processed here.');
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Since we can't access the code, we'll award a fixed number of points for the mock.
  return { pointsAwarded: 5 }; 
}

export default function SolutionForm({ challengeId, userId, onSubmitSuccess }: SolutionFormProps) {
  // State related to Paiza API calls, code input, language selection, test results
  // have been removed as they are no longer applicable with the iframe embed.

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    // This function is effectively a mock now.
    // Consider removing or significantly altering if iframe is permanent.
    // For now, it will just simulate a submission acknowledgment.
    // const result = await mockSubmitSolution(userId, challengeId);
    // toast({ title: 'Solution Acknowledged (Mock)!', description: `Mock system noted an attempt. Points: ${result.pointsAwarded}. Code from iframe is not evaluated by this button.` });
    // onSubmitSuccess(result.pointsAwarded);
    console.log("Submit button clicked, but code/output from iframe is not accessible.");
  };

  return (
    <form onSubmit={handleSubmitSolution} className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Code Your Solution Online</CardTitle>
          <CardDescription>Use the embedded Paiza.IO editor below to write, test, and run your code. You can copy your final solution if needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div style={{ width: '100%', height: '500px' }}>
            <iframe 
              src="https://paiza.io/projects/e/SB46KpvctEUY33uh0q_b0w?theme=ambiance" 
              width="100%" 
              height="500" 
              scrolling="no" 
              seamless={true}
              style={{ border: 'none' }}
              title="Paiza.IO Embedded Editor"
            ></iframe>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              type="submit" 
              disabled={true} // Disabled as we can't get code from iframe
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              title="Submission from iframe is not directly integrated with this button."
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Final Solution (Mock - Disabled)
            </Button>
          </div>
           <p className="text-xs text-muted-foreground mt-2">
            Note: The "Submit Final Solution" button above is a placeholder. Please ensure your solution is correct within the Paiza.IO environment. 
            Direct submission from the iframe to our system is not active for this button.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
