
import type { Campaign, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, Zap, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface CampaignCardProps {
  campaign: Campaign;
  user: UserProfile | null;
  // onApplySuccess is removed as internal applications are gone
}

export default function CampaignCard({ campaign, user }: CampaignCardProps) {
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

  // Simplified logic as internal application is removed
  const canInteractWithCampaign = user && campaign.status !== 'past';
  const buttonText = () => {
    if (campaign.status === 'past') return 'Campaign Ended';
    if (!campaign.applyLink) return 'Admin Managed Enrollment';
    if (!user) return 'Sign in to Apply Externally';
    return 'Apply via Link';
  };

  const renderApplyButton = () => {
    if (campaign.applyLink) {
      return (
        <Button
          asChild
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={!user || campaign.status === 'past'} // Disabled if not logged in or campaign is past
        >
          <a href={campaign.applyLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {buttonText()}
            {user && campaign.status !== 'past' && <ExternalLink className="ml-2 h-4 w-4" />}
          </a>
        </Button>
      );
    } else {
      return (
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled // Always disabled if no applyLink, as enrollment is admin-managed
          onClick={(e) => e.stopPropagation()}
        >
          {buttonText()}
        </Button>
      );
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/30 transition-all duration-300 h-full bg-card">
      <Link
        href={`/campaign/${campaign.id}`}
        className="block hover:opacity-90 transition-opacity"
      >
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
                  Requires {campaign.requiredPoints} points (for reference)
              </CardDescription>
          )}
          {campaign.applyLink && (
              <CardDescription className="text-xs flex items-center text-accent mt-1">
                  <ExternalLink className="w-3 h-3 mr-1"/>
                  External application link available
              </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground line-clamp-3">{campaign.description}</p>
        </CardContent>
      </Link>
      <CardFooter>
        {renderApplyButton()}
      </CardFooter>
    </Card>
  );
}
