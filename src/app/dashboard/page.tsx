'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, seedCampaigns } from '@/lib/firebase/firestore';
import type { Campaign } from '@/types';
import CampaignCard from '@/components/dashboard/CampaignCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<Set<string>>(new Set());

  const fetchCampaignData = async () => {
    setIsLoadingCampaigns(true);
    // await seedCampaigns(); // Optional: Seed data if collection is empty, remove for production
    const campaignList = await getCampaigns();
    setCampaigns(campaignList);
    setIsLoadingCampaigns(false);
  };
  
  useEffect(() => {
    fetchCampaignData();
  }, []);

  const handleApplicationSuccess = (campaignId: string) => {
    setAppliedCampaignIds(prev => new Set(prev).add(campaignId));
    // Potentially re-fetch user applications or update UI to reflect "Applied" status
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <Skeleton className="h-10 w-1/3 mx-auto mb-2" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Please sign in to view and apply for campaigns.
        </p>
        <Button asChild size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }
  
  const ongoingCampaigns = campaigns.filter(c => c.status === 'ongoing');
  const upcomingCampaigns = campaigns.filter(c => c.status === 'upcoming');
  const pastCampaigns = campaigns.filter(c => c.status === 'past');


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="text-center sm:text-left">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Campaign Dashboard</h1>
          <p className="text-lg text-muted-foreground">Explore and join exciting tech campaigns.</p>
        </div>
        <Button onClick={fetchCampaignData} variant="outline" className="mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
          Refresh Campaigns
        </Button>
      </div>

      {isLoadingCampaigns && !campaigns.length ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {ongoingCampaigns.length > 0 && (
            <CampaignSection title="Ongoing Campaigns" campaigns={ongoingCampaigns} user={userProfile} onApplySuccess={handleApplicationSuccess} />
          )}
          {upcomingCampaigns.length > 0 && (
            <CampaignSection title="Upcoming Campaigns" campaigns={upcomingCampaigns} user={userProfile} onApplySuccess={handleApplicationSuccess} />
          )}
          {campaigns.length === 0 && !isLoadingCampaigns && (
            <div className="text-center py-10">
              <h2 className="font-headline text-2xl mb-2">No Campaigns Available</h2>
              <p className="text-muted-foreground">Check back later for new opportunities, or try refreshing.</p>
            </div>
          )}
          {pastCampaigns.length > 0 && (
            <CampaignSection title="Past Campaigns" campaigns={pastCampaigns} user={userProfile} onApplySuccess={handleApplicationSuccess} />
          )}
        </>
      )}
    </div>
  );
}

interface CampaignSectionProps {
  title: string;
  campaigns: Campaign[];
  user: UserProfile | null;
  onApplySuccess: (campaignId: string) => void;
}

const CampaignSection = ({ title, campaigns, user, onApplySuccess }: CampaignSectionProps) => (
  <section className="mb-12">
    <h2 className="font-headline text-2xl md:text-3xl font-semibold mb-6 border-b-2 border-primary pb-2">{title}</h2>
    {campaigns.length === 0 ? (
      <p className="text-muted-foreground">No {title.toLowerCase()} at the moment.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} user={user} onApplySuccess={onApplySuccess} />
        ))}
      </div>
    )}
  </section>
);


const CardSkeleton = () => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
    <Skeleton className="h-48 w-full" />
    <div className="p-6">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-4" />
    </div>
    <div className="p-6 pt-0">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

