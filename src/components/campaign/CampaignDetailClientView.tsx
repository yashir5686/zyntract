
'use client';

import type { Campaign } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import CampaignPublicView from './CampaignPublicView';
import CampaignAdminPanel from './CampaignAdminPanel';
import { CampaignDetailPageSkeleton } from '@/app/campaign/[campaignId]/page';

interface CampaignDetailClientViewProps {
  campaign: Campaign;
}

export default function CampaignDetailClientView({ campaign }: CampaignDetailClientViewProps) {
  const { isAdmin, loading: authLoading } = useAuth();

  if (authLoading) {
    return <CampaignDetailPageSkeleton />;
  }

  if (isAdmin) {
    return <CampaignAdminPanel campaign={campaign} />;
  }

  return <CampaignPublicView campaign={campaign} />;
}
