
'use client';

import { useState } from 'react';
import type { UserDailyChallengeSubmission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateDailyChallengeSubmissionStatus } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, UserCircle, Code2, Edit3, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '../ui/separator';

interface SubmissionsReviewListProps {
  submissions: UserDailyChallengeSubmission[];
  dailyProblemDate: string;
  challengePoints: number;
  onSubmissionUpdate: () => void;
}

export default function SubmissionsReviewList({ submissions, dailyProblemDate, challengePoints, onSubmissionUpdate }: SubmissionsReviewListProps) {
  const [processingSubmissionId, setProcessingSubmissionId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<{ [userId: string]: string }>({});
  const { toast } = useToast();

  const handleUpdateStatus = async (
    submissionUserId: string, 
    newStatus: 'approved' | 'rejected',
    currentRejectionNote?: string
  ) => {
    if (newStatus === 'rejected' && (!currentRejectionNote || currentRejectionNote.trim() === '')) {
      toast({ variant: 'destructive', title: 'Rejection Note Required', description: 'Please provide a reason for rejection.' });
      return;
    }
    setProcessingSubmissionId(submissionUserId);
    try {
      await updateDailyChallengeSubmissionStatus(
        dailyProblemDate,
        submissionUserId,
        newStatus,
        newStatus === 'rejected' ? currentRejectionNote || null : null,
        challengePoints
      );
      toast({ title: 'Submission Updated', description: `Solution status changed to ${newStatus}.` });
      onSubmissionUpdate(); // Refresh the list
      if (currentRejectionNote) { // Clear note after successful rejection
        setRejectionNotes(prev => ({...prev, [submissionUserId]: ''}));
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Could not update submission.' });
    } finally {
      setProcessingSubmissionId(null);
    }
  };

  const handleNoteChange = (userId: string, note: string) => {
    setRejectionNotes(prev => ({ ...prev, [userId]: note }));
  };

  const getStatusBadge = (status: UserDailyChallengeSubmission['status']) => {
    switch (status) {
      case 'review':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> In Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ScrollArea className="h-[60vh] pr-2">
      <div className="space-y-4">
        {submissions.map(submission => (
          <Card key={submission.id} className="bg-card-foreground/5 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                <div>
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <UserCircle className="w-5 h-5 mr-2 text-primary" /> 
                        {submission.userName || submission.userEmail || 'Anonymous User'}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </CardDescription>
                </div>
                {getStatusBadge(submission.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Language: <span className="font-normal text-foreground">{submission.language}</span></h4>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Code2 className="w-4 h-4 mr-1.5"/> Submitted Code:</h4>
                    <ScrollArea className="h-40 rounded-md border bg-muted p-3">
                        <pre className="text-xs whitespace-pre-wrap break-all">{submission.code}</pre>
                    </ScrollArea>
                </div>

              {submission.status === 'review' && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Rejection notes (required if rejecting)"
                    value={rejectionNotes[submission.id] || ''}
                    onChange={(e) => handleNoteChange(submission.id, e.target.value)}
                    rows={2}
                    className="text-sm bg-input border-border"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(submission.id, 'approved')}
                      disabled={processingSubmissionId === submission.id}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      {processingSubmissionId === submission.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdateStatus(submission.id, 'rejected', rejectionNotes[submission.id])}
                      disabled={processingSubmissionId === submission.id}
                      className="flex-1"
                    >
                      {processingSubmissionId === submission.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Reject
                    </Button>
                  </div>
                </div>
              )}
              
              {(submission.status === 'approved' || submission.status === 'rejected') && (
                <div className="pt-2">
                    {submission.adminNotes && (
                        <div className="p-3 bg-muted/50 rounded-md border border-border">
                            <p className="text-sm font-semibold text-foreground flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2"/> Admin Feedback:
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{submission.adminNotes}</p>
                        </div>
                    )}
                    {submission.reviewedAt && (
                         <p className="text-xs text-muted-foreground mt-2">Reviewed: {new Date(submission.reviewedAt).toLocaleString()}</p>
                    )}
                    {/* Optional: Button to revert status back to 'review' */}
                     <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-3 w-full sm:w-auto text-xs"
                        onClick={() => handleUpdateStatus(submission.id, 'review')} // Assuming 'review' status doesn't change points.
                        disabled={processingSubmissionId === submission.id}
                      >
                        {processingSubmissionId === submission.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Edit3 className="mr-2 h-3 w-3" />}
                        Mark as Pending Review
                      </Button>
                </div>
              )}
            </CardContent>
             {submissions.length > 1 && <Separator className="my-2"/>}
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
