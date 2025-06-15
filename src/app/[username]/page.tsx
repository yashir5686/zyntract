
import React from 'react';
import { getUserProfileByUsername, getCampaignApplicationsByUserId, getCampaignById } from '@/lib/firebase/firestore';
import type { UserProfile, Campaign, CampaignApplication } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Zap, Briefcase, CalendarDays, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import ReferralCodeDisplay from '@/components/profile/ReferralCodeDisplay'; // Import the new component

interface ProfilePageParams {
  params: {
    username: string;
  };
}

interface AppliedCampaignDetails {
  application: CampaignApplication;
  campaign: Campaign | null;
}

export default async function UserProfilePage({ params }: ProfilePageParams) {
  const username = params.username;
  const profile = await getUserProfileByUsername(username);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-2">User Not Found</h1>
        <p className="text-lg text-muted-foreground">
          The profile for @{username} could not be found.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block text-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const applications = profile.uid ? await getCampaignApplicationsByUserId(profile.uid) : [];
  const appliedCampaignsDetails: AppliedCampaignDetails[] = await Promise.all(
    applications.map(async (app) => {
      const campaign = await getCampaignById(app.campaignId);
      return { application: app, campaign };
    })
  );

  const approvedCampaignsDetails = appliedCampaignsDetails.filter(
    details => details.application.status === 'approved' && details.campaign
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center p-8 bg-gradient-to-br from-card to-secondary/20 rounded-t-lg">
          <Avatar className="mx-auto h-24 w-24 mb-4 border-4 border-primary shadow-lg">
            {profile.photoURL ? (
               <Image src={profile.photoURL} alt={profile.displayName || profile.username || 'User'} fill className="rounded-full" data-ai-hint="profile picture" />
            ) : (
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : <UserCircle className="h-16 w-16" />}
              </AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="font-headline text-4xl">{profile.displayName || 'User'}</CardTitle>
          <CardDescription className="text-xl text-primary">@{profile.username}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <section>
            <h2 className="font-headline text-2xl font-semibold mb-4 text-primary flex items-center">
              <Zap className="w-6 h-6 mr-2" /> Stats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard title="Total Points" value={profile.points ?? 0} icon={<Zap className="text-accent"/>} />
              <StatCard title="Daily Streak" value={profile.dailyChallengeStreak ?? 0} icon={<CalendarDays className="text-accent"/>} />
            </div>
          </section>

          <ReferralCodeDisplay profileBeingViewed={profile} />

          <section>
            <h2 className="font-headline text-2xl font-semibold mb-4 text-primary flex items-center">
              <Briefcase className="w-6 h-6 mr-2" /> Campaigns
            </h2>
            {approvedCampaignsDetails.length > 0 ? (
              <div className="space-y-4">
                {approvedCampaignsDetails.map(({ application, campaign }) => (
                  <CampaignListItem key={application.id || campaign!.id} campaign={campaign!} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">This user is not currently part of any approved campaigns.</p>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <div className="p-4 bg-card-foreground/5 rounded-lg shadow flex items-center space-x-3">
    <div className="p-2 bg-primary/10 rounded-full text-primary">
      {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

interface CampaignListItemProps {
  campaign: Campaign;
}

const CampaignListItem = ({ campaign }: CampaignListItemProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {campaign.imageUrl && (
          <div className="sm:w-1/3 relative h-32 sm:h-auto">
             <Image
                src={campaign.imageUrl}
                alt={campaign.name}
                fill
                sizes="(min-width: 640px) 256px, 100vw"
                style={{ objectFit: 'cover' }}
                data-ai-hint="technology abstract"
              />
          </div>
        )}
        <div className={`p-4 ${campaign.imageUrl ? 'sm:w-2/3' : 'w-full'}`}>
          <div className="flex justify-between items-start mb-1">
             <Link href={`/campaign/${campaign.id}`} className="hover:underline">
                <h3 className="font-headline text-xl font-semibold text-foreground">{campaign.name}</h3>
            </Link>
            <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            End Date: {new Date(campaign.endDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
           <Link href={`/campaign/${campaign.id}`} className="text-sm text-primary hover:underline mt-2 inline-block">
            View Campaign
          </Link>
        </div>
      </div>
    </Card>
  );
};

export function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center p-8 bg-gradient-to-br from-card to-secondary/20 rounded-t-lg">
          <Skeleton className="mx-auto h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-1/3 mx-auto" />
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <section>
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </section>
          {/* Referral code skeleton removed as it's now handled by a client component */}
          <section>
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
