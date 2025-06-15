
'use client';

import type { Campaign, CampaignApplication } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CalendarDays, Zap, CheckCircle, Info, ExternalLink, Edit, PlusCircle, Users2, BookOpen, Laptop, HelpCircle, BarChart3, FileText, Loader2, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import ManageCoursesDialog from './dialogs/ManageCoursesDialog';
import ManageStudentsDialog from './dialogs/ManageStudentsDialog';
import ManageProjectsDialog from './dialogs/ManageProjectsDialog';
import ManageQuizzesDialog from './dialogs/ManageQuizzesDialog';
import EditCampaignForm from './dialogs/EditCampaignForm'; // Import EditCampaignForm
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // Added DialogDescription import
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCampaignApplicationsForCampaign } from '@/lib/firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation'; // Import useRouter

interface CampaignAdminPanelProps {
  campaign: Campaign;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusBadge = (status: Campaign['status'] | CampaignApplication['status']) => {
  switch (status) {
    case 'ongoing':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 whitespace-nowrap"><CheckCircle className="w-3 h-3 mr-1" /> Ongoing</Badge>;
    case 'upcoming':
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 whitespace-nowrap"><Info className="w-3 h-3 mr-1" /> Upcoming</Badge>;
    case 'past':
      return <Badge variant="outline" className="bg-gray-500 hover:bg-gray-600 whitespace-nowrap"><AlertTriangle className="w-3 h-3 mr-1" /> Past</Badge>;
    case 'approved':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
    case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600"><Info className="w-3 h-3 mr-1" /> Pending</Badge>;
    case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    default:
      return <Badge variant="outline" className="whitespace-nowrap">{status}</Badge>;
  }
};

const ApprovedParticipantListItem = ({ application }: { application: CampaignApplication }) => {
    return (
        <Card className="bg-card-foreground/5">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <p className="font-semibold text-sm">{application.userName || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{application.userEmail}</p>
                        <p className="text-xs text-muted-foreground">Approved on: {formatDate(application.appliedAt)}</p>
                    </div>
                     <UserCheck className="w-5 h-5 text-green-500" />
                </div>
            </CardContent>
        </Card>
    );
};


export default function CampaignAdminPanel({ campaign }: CampaignAdminPanelProps) {
  const [isManageCoursesOpen, setIsManageCoursesOpen] = useState(false);
  const [isManageProjectsOpen, setIsManageProjectsOpen] = useState(false);
  const [isManageQuizzesOpen, setIsManageQuizzesOpen] = useState(false);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [isEditCampaignDialogOpen, setIsEditCampaignDialogOpen] = useState(false); // State for edit dialog
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [applicationsList, setApplicationsList] = useState<CampaignApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const router = useRouter(); // Initialize useRouter

  const fetchApplicationsList = useCallback(async () => {
    if (!campaign.id) return;
    setIsLoadingApplications(true);
    try {
      const apps = await getCampaignApplicationsForCampaign(campaign.id);
      setApplicationsList(apps);
    } catch (error) {
      console.error("Failed to fetch applications for admin panel:", error);
      setApplicationsList([]); 
    } finally {
      setIsLoadingApplications(false);
    }
  }, [campaign.id]);

  useEffect(() => {
    fetchApplicationsList();
  }, [fetchApplicationsList]);

  const approvedParticipants = applicationsList.filter(app => app.status === 'approved');

  const handleCampaignUpdated = () => {
    router.refresh(); // Refresh page data
    setIsEditCampaignDialogOpen(false); // Close dialog
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        {campaign.imageUrl && (
          <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
            <DialogTrigger asChild>
              <div className="relative w-full h-64 md:h-80 cursor-pointer">
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
            </DialogTrigger>
            <DialogContent className="max-w-screen-lg p-0 bg-transparent border-0 shadow-none">
              <DialogHeader>
                <DialogTitle className="sr-only">Enlarged campaign image: {campaign.name}</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-video max-h-[80vh]">
                <Image
                  src={campaign.imageUrl}
                  alt={`${campaign.name} - Full size`}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-md"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
            <div className="flex-grow">
                <CardTitle className="font-headline text-3xl md:text-4xl">{campaign.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Campaign ID: {campaign.id}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0">
                {getStatusBadge(campaign.status)}
                <Dialog open={isEditCampaignDialogOpen} onOpenChange={setIsEditCampaignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                        <Edit className="w-3 h-3 mr-1.5" /> Edit Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                     <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Edit Campaign</DialogTitle>
                        <DialogDescription>
                            Make changes to the campaign details below.
                        </DialogDescription>
                    </DialogHeader>
                    <EditCampaignForm 
                        campaign={campaign} 
                        onCampaignUpdated={handleCampaignUpdated} 
                        setOpen={setIsEditCampaignDialogOpen} 
                    />
                  </DialogContent>
                </Dialog>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm mt-2">
            <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
            {campaign.requiredPoints && campaign.requiredPoints > 0 && (
              <span className="flex items-center"><Zap className="w-4 h-4 mr-2 text-accent" /> {campaign.requiredPoints} points for reference</span>
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
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="details"><FileText className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Details</TabsTrigger>
              <TabsTrigger value="content"><BookOpen className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Content</TabsTrigger>
              <TabsTrigger value="participants"><Users2 className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Participants</TabsTrigger>
              <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <h2 className="font-headline text-xl font-semibold mb-3 text-primary">About this Campaign</h2>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
            </TabsContent>

            <TabsContent value="content">
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
            </TabsContent>

            <TabsContent value="participants">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center"><Users2 className="w-5 h-5 mr-2 text-primary"/> Approved Participants</CardTitle>
                        <CardDescription>View approved participants. Use the button below to manage all applications and enroll new students.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Dialog open={isManageStudentsOpen} onOpenChange={setIsManageStudentsOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full justify-start" variant="default"><Users2 className="w-4 h-4 mr-2"/> Manage Student Enrollment</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                                <ManageStudentsDialog 
                                  campaignId={campaign.id} 
                                  campaignName={campaign.name} 
                                  setOpen={setIsManageStudentsOpen} 
                                  onApplicationsUpdate={fetchApplicationsList} 
                                />
                            </DialogContent>
                        </Dialog>
                        
                        <Separator className="my-4" />

                        <h4 className="font-semibold text-md text-muted-foreground">Currently Enrolled Participants ({approvedParticipants.length})</h4>
                        {isLoadingApplications ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : approvedParticipants.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No participants enrolled in this campaign yet.</p>
                        ) : (
                            <ScrollArea className="h-[400px] pr-3">
                                <div className="space-y-3">
                                    {approvedParticipants.map(app => (
                                        <ApprovedParticipantListItem key={app.id} application={app} />
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="stats">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-primary"/> Campaign Statistics &amp; Overview</CardTitle>
                        <CardDescription>View overall progress, enrollment numbers, and other key metrics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Statistics and overview section coming soon...</p>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
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

    
