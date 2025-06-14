
'use client';

import type { Campaign } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import CampaignPublicView from './CampaignPublicView';
import CampaignAdminPanel from './CampaignAdminPanel';
import { CampaignDetailPageSkeleton } from '@/app/campaign/[campaignId]/page';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, ShieldCheck } from 'lucide-react';

interface CampaignDetailClientViewProps {
  campaign: Campaign;
}

export default function CampaignDetailClientView({ campaign }: CampaignDetailClientViewProps) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [currentViewMode, setCurrentViewMode] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    if (isAdmin) {
      setCurrentViewMode('admin'); // Default to admin view if user is admin
    } else {
      setCurrentViewMode('user'); // Default to user view if not admin
    }
  }, [isAdmin, user]); // Re-evaluate if isAdmin or user changes

  const handleToggleView = () => {
    if (isAdmin) {
      setCurrentViewMode(prevMode => (prevMode === 'admin' ? 'user' : 'admin'));
    }
  };

  if (authLoading) {
    return <CampaignDetailPageSkeleton />;
  }

  const showAdminPanel = isAdmin && currentViewMode === 'admin';

  return (
    <div>
      {isAdmin && (
        <div className="mb-6 flex justify-end">
          <Button onClick={handleToggleView} variant="outline" size="sm">
            {currentViewMode === 'admin' ? (
              <>
                <Eye className="mr-2 h-4 w-4" /> View as User
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" /> Switch to Admin View
              </>
            )}
          </Button>
        </div>
      )}

      {showAdminPanel ? (
        <CampaignAdminPanel campaign={campaign} />
      ) : (
        <CampaignPublicView campaign={campaign} />
      )}
    </div>
  );
}

