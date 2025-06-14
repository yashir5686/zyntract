
import type { Campaign, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, Zap, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
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
import Link from 'next/link';

interface CampaignCardProps {
  campaign: Campaign;
  user: UserProfile | null;
  onApplySuccess?: (campaignId: string) => void;
}

export default function CampaignCard({ campaign, user, onApplySuccess }: CampaignCardProps) {
  const { toast } = useToast();
  const [isApplyingInternal, setIsApplyingInternal] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleInternalApply = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Required', description: 'Please sign in to apply.' });
      return;
    }
    if (campaign.status !== 'ongoing' && campaign.status !== 'upcoming') {
      toast({ variant: 'destructive', title: 'Cannot Apply', description: 'This campaign is not open for applications.' });
      return;
    }
    if (user.points === undefined || (campaign.requiredPoints || 0) > user.points) {
       toast({ variant: 'destructive', title: 'Insufficient Points', description: `You need ${campaign.requiredPoints} points. You have ${user.points || 0}.` });
       return;
    }

    setIsApplyingInternal(true);
    try {
      await applyToCampaign(user.uid, campaign.id, user.displayName || undefined, user.email || undefined, campaign.name);
      toast({ title: 'Application Submitted!', description: `Your application for ${campaign.name} has been sent for review.` });
      if (onApplySuccess) onApplySuccess(campaign.id);
      setIsDialogOpen(false); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Application Failed', description: error.message || 'Could not submit application.' });
    } finally {
      setIsApplyingInternal(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const getStatusBadge = () => {
    switch (campaign.status) {
      case 'ongoing':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Ongoing</Badge>;
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600"><Info className="w-3 h-3 mr-1" /> Upcoming</Badge>;
      case 'past':
        return <Badge variant="outline" className="bg-gray-500 hover:bg-gray-600"><AlertTriangle className="w-3 h-3 mr-1" /> Past</Badge>;
      default:
        return null;
    }
  };
  
  const isUserEligible = user && (campaign.requiredPoints || 0) <= (user.points || 0);
  const canApply = user && (campaign.status === 'ongoing' || campaign.status === 'upcoming') && isUserEligible;
  const cannotApplyReason = () => {
    if (campaign.status === 'past') return 'Campaign Ended';
    if (!user) return 'Sign in to Apply';
    if (!isUserEligible) return 'Not Enough Points';
    return 'Apply Now';
  };

  const renderApplyButton = () => {
    if (campaign.applyLink) {
      return (
        <Button
          asChild
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={!user || campaign.status === 'past' || !isUserEligible}
        >
          <a href={campaign.applyLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {campaign.status === 'past' ? 'Campaign Ended' : !user ? 'Sign in to Apply' : !isUserEligible ? 'Not Enough Points' : 'Apply via Link'}
            {canApply && <ExternalLink className="ml-2 h-4 w-4" />}
          </a>
        </Button>
      );
    } else {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!user || campaign.status === 'past' || isApplyingInternal || !isUserEligible}
              onClick={(e) => e.stopPropagation()} // Prevent Link navigation
            >
              {cannotApplyReason()}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Apply to: {campaign.name}</DialogTitle>
              <DialogDescription>
                Confirm your application for this campaign. Your profile will be submitted for review.
              </DialogDescription>
            </DialogHeader>
             {user && !isUserEligible && (
                 <p className="text-destructive text-sm">You need {campaign.requiredPoints} points to apply, but you only have {user.points || 0}.</p>
             )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleInternalApply} disabled={isApplyingInternal || !isUserEligible}>
                {isApplyingInternal ? 'Submitting...' : 'Confirm Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/30 transition-all duration-300 h-full bg-card">
      <Link href={`/campaign/${campaign.id}`} passHref legacyBehavior>
        <a className="block hover:opacity-90 transition-opacity">
          {campaign.imageUrl && (
            <div className="relative w-full h-48">
              <Image
                src={campaign.imageUrl}
                alt={campaign.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                style={{ objectFit: 'cover' }}
                data-ai-hint="technology abstract"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="font-headline text-2xl mb-1 group-hover:underline">{campaign.name}</CardTitle>
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
            {campaign.applyLink && (
                <CardDescription className="text-xs flex items-center text-accent mt-1">
                    <ExternalLink className="w-3 h-3 mr-1"/>
                    External application
                </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground line-clamp-3">{campaign.description}</p>
          </CardContent>
        </a>
      </Link>
      <CardFooter>
        {renderApplyButton()}
      </CardFooter>
    </Card>
  );
}
