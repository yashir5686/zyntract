
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getCertificatesForCourseForAdmin, updateCertificateStatusByAdmin } from '@/lib/firebase/firestore';
import type { UserCourseCertificate } from '@/types';
import { Loader2, CheckCircle, XCircle, ExternalLink, MessageSquare, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface CourseSubmissionsReviewDialogProps {
  courseId: string;
  courseTitle: string;
  setOpen: (open: boolean) => void;
  onSubmissionsUpdated: () => void; 
}

export default function CourseSubmissionsReviewDialog({ courseId, courseTitle, setOpen, onSubmissionsUpdated }: CourseSubmissionsReviewDialogProps) {
  const [submissions, setSubmissions] = useState<UserCourseCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Stores ID of submission being processed
  const [rejectionNotes, setRejectionNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSubmissions = await getCertificatesForCourseForAdmin(courseId);
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching submissions', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleUpdateStatus = async (certificateId: string, status: 'approved' | 'rejected') => {
    setIsProcessing(certificateId);
    const notes = status === 'rejected' ? rejectionNotes[certificateId] : undefined;
    if (status === 'rejected' && (!notes || notes.trim() === '')) {
      toast({ variant: 'destructive', title: 'Rejection Note Required', description: 'Please provide a reason for rejection.' });
      setIsProcessing(null);
      return;
    }

    try {
      await updateCertificateStatusByAdmin(certificateId, status, notes);
      toast({ title: 'Status Updated', description: `Certificate has been ${status}.` });
      fetchSubmissions(); // Refresh the list
      onSubmissionsUpdated(); // Notify parent to update counts
      if (rejectionNotes[certificateId]) {
        setRejectionNotes(prev => ({ ...prev, [certificateId]: '' })); // Clear notes after submission
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to Update Status', description: (error as Error).message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleNoteChange = (certificateId: string, value: string) => {
    setRejectionNotes(prev => ({ ...prev, [certificateId]: value }));
  };
  
  const getStatusBadge = (status: UserCourseCertificate['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'review':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600"><Info className="w-3 h-3 mr-1" /> In Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-xl">Review Submissions: {courseTitle}</DialogTitle>
        <DialogDescription>View and manage certificate submissions for this course.</DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] pr-3 my-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No certificate submissions for this course yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <Card key={sub.id} className="bg-card-foreground/5">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-md font-semibold">{sub.userName || 'N/A'}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">{sub.userEmail || 'N/A'}</CardDescription>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <Button asChild variant="link" size="sm" className="p-0 h-auto mb-2">
                        <a href={sub.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Submitted Certificate
                        </a>
                    </Button>
                  
                  {sub.status === 'review' && (
                    <div className="mt-3 space-y-3">
                      <Textarea 
                        placeholder="Add rejection notes (required if rejecting)..."
                        value={rejectionNotes[sub.id] || ''}
                        onChange={(e) => handleNoteChange(sub.id, e.target.value)}
                        rows={2}
                        className="text-xs bg-input border-border"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-green-600 hover:bg-green-700 flex-1" 
                          onClick={() => handleUpdateStatus(sub.id, 'approved')}
                          disabled={isProcessing === sub.id}
                        >
                          {isProcessing === sub.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                          disabled={isProcessing === sub.id}
                        >
                          {isProcessing === sub.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <XCircle className="w-4 h-4 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}
                  {(sub.status === 'approved' || sub.status === 'rejected') && sub.adminNotes && (
                     <div className="mt-3 p-2.5 bg-muted/50 rounded-md border border-border">
                        <p className="text-xs font-medium text-foreground flex items-center"><MessageSquare className="w-3 h-3 mr-1.5"/> Admin Notes:</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{sub.adminNotes}</p>
                     </div>
                  )}
                   {(sub.status === 'approved' || sub.status === 'rejected') && !sub.adminNotes && sub.reviewedAt && (
                     <p className="text-xs text-muted-foreground mt-2">Reviewed on: {new Date(sub.reviewedAt).toLocaleDateString()}</p>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

