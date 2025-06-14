
'use client';

import type { Campaign } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CalendarDays, Zap, CheckCircle, Info, ExternalLink, Edit, PlusCircle, Users2, BookOpen, Laptop, HelpCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import ManageCoursesDialog from './dialogs/ManageCoursesDialog';
import ManageStudentsDialog from './dialogs/ManageStudentsDialog';
import ManageProjectsDialog from './dialogs/ManageProjectsDialog';
import ManageQuizzesDialog from './dialogs/ManageQuizzesDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CampaignAdminPanelProps {
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

export default function CampaignAdminPanel({ campaign }: CampaignAdminPanelProps) {
  const [isManageCoursesOpen, setIsManageCoursesOpen] = useState(false);
  const [isManageProjectsOpen, setIsManageProjectsOpen] = useState(false);
  const [isManageQuizzesOpen, setIsManageQuizzesOpen] = useState(false);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);

  const handleEditCampaign = () => alert(`Editing campaign: ${campaign.name} (Not implemented yet)`);

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
            <div className="flex-grow">
                <CardTitle className="font-headline text-3xl md:text-4xl">{campaign.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Campaign ID: {campaign.id}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0">
                {getStatusBadge(campaign.status)}
                <Button variant="outline" size="sm" onClick={handleEditCampaign} className="whitespace-nowrap">
                    <Edit className="w-3 h-3 mr-1.5" /> Edit Campaign
                </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm mt-2">
            <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
            {campaign.requiredPoints && campaign.requiredPoints > 0 && (
              <span className="flex items-center"><Zap className="w-4 h-4 mr-2 text-accent" /> {campaign.requiredPoints} points to apply</span>
            )}
            {campaign.applyLink && (
                <span className="flex items-center text-xs text-accent/80">
                    <ExternalLink className="w-3 h-3 mr-1"/>
                    External application: <a href={campaign.applyLink} target="_blank" rel="noopener noreferrer" className="underline ml-1">{campaign.applyLink}</a>
                </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h2 className="font-headline text-xl font-semibold mb-3 text-primary">About this Campaign</h2>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
          
          <Separator className="my-8" />

          <section id="admin-controls" className="space-y-6">
            <h2 className="font-headline text-2xl font-semibold text-primary border-b pb-2">Admin Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center"><BookOpen className="w-5 h-5 mr-2 text-primary"/> Manage Content</CardTitle>
                        <CardDescription>Add or edit courses, projects, and quizzes for this campaign.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Dialog open={isManageCoursesOpen} onOpenChange={setIsManageCoursesOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full justify-start" variant="outline"><PlusCircle className="w-4 h-4 mr-2"/> Manage Courses</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                <ManageCoursesDialog campaignId={campaign.id} setOpen={setIsManageCoursesOpen} />
                            </DialogContent>
                        </Dialog>
                         <Dialog open={isManageProjectsOpen} onOpenChange={setIsManageProjectsOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full justify-start" variant="outline"><Laptop className="w-4 h-4 mr-2"/> Manage Projects</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                <ManageProjectsDialog campaignId={campaign.id} setOpen={setIsManageProjectsOpen} />
                            </DialogContent>
                        </Dialog>
                         <Dialog open={isManageQuizzesOpen} onOpenChange={setIsManageQuizzesOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full justify-start" variant="outline"><HelpCircle className="w-4 h-4 mr-2"/> Manage Quizzes</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                <ManageQuizzesDialog campaignId={campaign.id} setOpen={setIsManageQuizzesOpen} />
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center"><Users2 className="w-5 h-5 mr-2 text-primary"/> Manage Participants</CardTitle>
                        <CardDescription>View applications, enroll/remove participants from this campaign.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isManageStudentsOpen} onOpenChange={setIsManageStudentsOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full justify-start" variant="outline"><Users2 className="w-4 h-4 mr-2"/> Manage Students</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                                <ManageStudentsDialog campaignId={campaign.id} campaignName={campaign.name} setOpen={setIsManageStudentsOpen} />
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

             <Card className="shadow-md mt-6">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-primary"/> Campaign Statistics &amp; Overview</CardTitle>
                    <CardDescription>View overall progress, enrollment numbers, and other key metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Statistics and overview section coming soon...</p>
                </CardContent>
            </Card>
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
