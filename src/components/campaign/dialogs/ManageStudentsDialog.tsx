
'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { getCampaignApplicationsForCampaign, updateCampaignApplicationStatus, enrollUserInCampaignByEmail } from '@/lib/firebase/firestore';
import type { CampaignApplication } from '@/types';
import { Users2, UserPlus, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ManageStudentsDialogProps {
  campaignId: string;
  campaignName: string;
  setOpen: (open: boolean) => void;
  onApplicationsUpdate: () => void; // Callback to refresh the list in the parent
}

const enrollUserSchema = z.object({
  email: z.string().email('Invalid email address.'),
});
type EnrollUserFormValues = z.infer<typeof enrollUserSchema>;

export default function ManageStudentsDialog({ campaignId, campaignName, setOpen, onApplicationsUpdate }: ManageStudentsDialogProps) {
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingApps, setIsFetchingApps] = useState(true);
  const { toast } = useToast();

  const enrollForm = useForm<EnrollUserFormValues>({
    resolver: zodResolver(enrollUserSchema),
    defaultValues: { email: '' },
  });

  const fetchApplications = async () => {
    setIsFetchingApps(true);
    try {
      const fetchedApps = await getCampaignApplicationsForCampaign(campaignId);
      setApplications(fetchedApps);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching applications', description: (error as Error).message });
    } finally {
      setIsFetchingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [campaignId]);

  const handleStatusChange = async (applicationId: string, status: CampaignApplication['status']) => {
    setIsLoading(true);
    try {
      await updateCampaignApplicationStatus(applicationId, status);
      toast({ title: 'Status Updated', description: `Application status changed to ${status}.` });
      fetchApplications(); // Refresh list in dialog
      onApplicationsUpdate(); // Refresh list in parent
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to Update Status', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollUser = async (data: EnrollUserFormValues) => {
    setIsLoading(true);
    try {
      await enrollUserInCampaignByEmail(campaignId, data.email, campaignName);
      toast({ title: 'User Enrolled!', description: `${data.email} has been enrolled and their application marked as approved.` });
      enrollForm.reset();
      fetchApplications(); // Refresh list in dialog
      onApplicationsUpdate(); // Refresh list in parent
    } catch (error) {
      toast({ variant: 'destructive', title: 'Enrollment Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusBadge = (status: CampaignApplication['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl flex items-center">
          <Users2 className="w-6 h-6 mr-2 text-primary" /> Manage Student Enrollment
        </DialogTitle>
        <DialogDescription>Enroll users, and review/manage applications for "{campaignName}".</DialogDescription>
      </DialogHeader>

      <div className="py-4 max-h-[70vh] flex flex-col">
        <section className="mb-6">
          <h3 className="font-headline text-lg mb-3">Enroll User Manually</h3>
          <Form {...enrollForm}>
            <form onSubmit={enrollForm.handleSubmit(handleEnrollUser)} className="flex items-start gap-2">
              <FormField
                control={enrollForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">User Email</FormLabel>
                    <FormControl><Input placeholder="user@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && enrollForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Enroll User
              </Button>
            </form>
          </Form>
        </section>

        <Separator className="my-4" />
        
        <section className="flex-grow overflow-hidden flex flex-col">
            <h3 className="font-headline text-lg mb-3">All Applications & Enrolled Students ({applications.length})</h3>
            <ScrollArea className="flex-grow pr-3">
                {isFetchingApps ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : applications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No applications or enrollments for this campaign yet.</p>
                ) : (
                    <div className="space-y-3">
                        {applications.map(app => (
                            <Card key={app.id} className="bg-card-foreground/5 p-3">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div>
                                        <p className="font-semibold">{app.userName || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground">{app.userEmail}</p>
                                        <p className="text-xs text-muted-foreground">Applied/Enrolled: {new Date(app.appliedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        {getStatusBadge(app.status)}
                                        {app.status === 'pending' && (
                                            <div className="flex gap-2 mt-2 sm:mt-0">
                                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(app.id, 'approved')} disabled={isLoading}>
                                                    <CheckCircle className="w-4 h-4 mr-1"/> Approve
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(app.id, 'rejected')} disabled={isLoading}>
                                                    <XCircle className="w-4 h-4 mr-1"/> Reject
                                                </Button>
                                            </div>
                                        )}
                                         {(app.status === 'approved' || app.status === 'rejected') && app.status !== 'pending' && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(app.id, 'pending')} disabled={isLoading} className="mt-2 sm:mt-0">
                                                Set to Pending
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </section>
      </div>

      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}


    