
import { getCampaignById } from '@/lib/firebase/firestore';
import type { Campaign } from '@/types';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CampaignDetailClientView from '@/components/campaign/CampaignDetailClientView';

interface CampaignDetailPageProps {
  params: {
    campaignId: string;
  };
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const campaignId = params.campaignId;
  const campaign = await getCampaignById(campaignId);

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-2">Campaign Not Found</h1>
        <p className="text-lg text-muted-foreground">
          The campaign you are looking for does not exist or may have been removed.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <CampaignDetailClientView campaign={campaign} />;
}

// Skeleton for this page (optional, Next.js App Router can use loading.tsx)
export function CampaignDetailPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="w-full h-[80vh]" />
    </div>
  );
}
