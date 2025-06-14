
import type { Campaign } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CalendarDays, Zap, CheckCircle, Info, ExternalLink, ListChecks, Trophy, Users, Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CampaignPublicViewProps {
  campaign: Campaign;
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusBadge = (status: Campaign['status']) => {
  switch (status) {
    case 'ongoing':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 whitespace-nowrap"><CheckCircle className="w-3 h-3 mr-1" /> Ongoing</Badge>;
    case 'upcoming':
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 whitespace-nowrap"><Info className="w-3 h-3 mr-1" /> Upcoming</Badge>;
    case 'past':
      return <Badge variant="outline" className="bg-gray-500 hover:bg-gray-600 whitespace-nowrap"><AlertTriangle className="w-3 h-3 mr-1" /> Past</Badge>;
    default:
      return <Badge variant="outline" className="whitespace-nowrap">{status}</Badge>;
  }
};

export default function CampaignPublicView({ campaign }: CampaignPublicViewProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl overflow-hidden">
        {campaign.imageUrl && (
          <div className="relative w-full h-64 md:h-80">
            <Image
              src={campaign.imageUrl}
              alt={campaign.name}
              fill
              sizes="(min-width: 1024px) 66vw, (min-width: 768px) 75vw, 100vw"
              style={{ objectFit: 'cover' }}
              className="bg-muted"
              priority
              data-ai-hint="campaign event"
            />
          </div>
        )}
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
            <CardTitle className="font-headline text-3xl md:text-4xl">{campaign.name}</CardTitle>
            {getStatusBadge(campaign.status)}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm">
            <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
            {campaign.requiredPoints && campaign.requiredPoints > 0 && (
              <span className="flex items-center"><Zap className="w-4 h-4 mr-2 text-accent" /> {campaign.requiredPoints} points to apply</span>
            )}
            {campaign.applyLink && (
                <span className="flex items-center text-xs text-accent/80">
                    <ExternalLink className="w-3 h-3 mr-1"/>
                    External application
                </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h2 className="font-headline text-xl font-semibold mb-3 text-primary">About this Campaign</h2>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
          
          <Separator className="my-8" />

          <section id="campaign-content" className="mb-8">
            <h2 className="font-headline text-xl font-semibold mb-4 text-primary">Campaign Content &amp; Activities</h2>
            <div className="p-6 bg-card-foreground/10 rounded-lg text-center border border-border">
                <Info className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">
                    Detailed information and interactive sections will be available here for enrolled participants.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  This includes: Courses <ListChecks className="inline h-4 w-4 mx-1" />, Projects <Brain className="inline h-4 w-4 mx-1" />, Quizzes & Challenges <Zap className="inline h-4 w-4 mx-1 text-accent" />, and Leaderboards <Trophy className="inline h-4 w-4 mx-1 text-yellow-500" />.
                </p>
                 <p className="text-xs text-muted-foreground mt-4">
                    (Full features coming soon!)
                </p>
            </div>
          </section>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/20 flex justify-end">
             <Button asChild variant="outline">
                <Link href="/dashboard">Back to Dashboard</Link>
             </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
