import type { Campaign, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, Zap, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import { applyToCampaign } from '@/lib/firebase/firestore';
import { useState } from 'react';

interface CampaignCardProps {
  campaign: Campaign;
  user: UserProfile | null;
  onApplySuccess?: (campaignId: string) => void;
}

export default function CampaignCard({ campaign, user, onApplySuccess }: CampaignCardProps) {
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleApply = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Required', description: 'Please sign in to apply for campaigns.' });
      return;
    }
    if (campaign.status !== 'ongoing' && campaign.status !== 'upcoming') {
      toast({ variant: 'destructive', title: 'Cannot Apply', description: 'This campaign is not currently open for applications.' });
      return;
    }
    if (user.points === undefined || (campaign.requiredPoints || 0) > user.points) {
       toast({ variant: 'destructive', title: 'Insufficient Points', description: `You need ${campaign.requiredPoints} points to apply for this campaign. You have ${user.points || 0}.` });
       return;
    }

    setIsApplying(true);
    try {
      await applyToCampaign(user.uid, campaign.id, user.displayName || undefined, user.email || undefined, campaign.name);
      toast({ title: 'Application Submitted!', description: `Your application for ${campaign.name} has been sent for review.` });
      if (onApplySuccess) onApplySuccess(campaign.id);
      setIsDialogOpen(false); // Close dialog on success
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Application Failed', description: error.message || 'Could not submit application.' });
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const getStatusBadge = () => {
    switch (campaign.status) {
      case 'ongoing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Ongoing</span>;
      case 'upcoming':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100"><Info className="w-3 h-3 mr-1" /> Upcoming</span>;
      case 'past':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"><AlertTriangle className="w-3 h-3 mr-1" /> Past</span>;
      default:
        return null;
    }
  };


  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/30 transition-all duration-300 h-full bg-card">
      {campaign.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={campaign.imageUrl}
            alt={campaign.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="technology abstract"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-2xl mb-1">{campaign.name}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-sm flex items-center text-muted-foreground">
          <CalendarDays className="w-4 h-4 mr-2" />
          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
        </CardDescription>
         {campaign.requiredPoints && campaign.requiredPoints > 0 && (
            <CardDescription className="text-sm flex items-center text-muted-foreground mt-1">
                <Zap className="w-4 h-4 mr-2 text-accent"/>
                Requires {campaign.requiredPoints} points
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-3">{campaign.description}</p>
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!user || campaign.status === 'past' || isApplying || (campaign.requiredPoints || 0) > (user?.points || 0) }
            >
              { (campaign.requiredPoints || 0) > (user?.points || 0) && user ? 'Not Enough Points' : campaign.status === 'past' ? 'Campaign Ended' : 'Apply Now' }
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Apply to: {campaign.name}</DialogTitle>
              <DialogDescription>
                Confirm your application for this campaign. Your profile will be submitted for review.
              </DialogDescription>
            </DialogHeader>
             {user && (campaign.requiredPoints || 0) > (user.points || 0) && (
                 <p className="text-destructive text-sm">You need {campaign.requiredPoints} points to apply, but you only have {user.points || 0}.</p>
             )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleApply} disabled={isApplying || (user && (campaign.requiredPoints || 0) > (user.points || 0))}>
                {isApplying ? 'Submitting...' : 'Confirm Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
