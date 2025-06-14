
'use client';

import type { Campaign, CampaignApplication, Course, Project, QuizChallenge } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CalendarDays, Zap, CheckCircle, Info, ExternalLink, ListChecks, Trophy, Brain, Loader2, BookOpen, LinkIcon, FileText, HelpCircle, FileBadge } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getCampaignApplicationForUser, getCoursesForCampaign, getProjectsForCampaign, getQuizChallengesForCampaign } from '@/lib/firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CampaignPublicViewProps {
  campaign: Campaign;
}

const formatDate = (dateString?: string) => {
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

interface CourseItemProps {
  course: Course;
}

const CourseItemCard = ({ course }: CourseItemProps) => {
  return (
    <Card className="bg-card-foreground/10 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-primary" />
          {course.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{course.description}</p>
        <Button asChild variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
          <a href={course.courseUrl} target="_blank" rel="noopener noreferrer">
            <LinkIcon className="w-4 h-4 mr-1" /> View Course
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};


export default function CampaignPublicView({ campaign }: CampaignPublicViewProps) {
  const { user } = useAuth();
  const [enrollmentStatus, setEnrollmentStatus] = useState<CampaignApplication['status'] | 'not_applied' | 'checking'>('checking');
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quizzes, setQuizzes] = useState<QuizChallenge[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    const checkEnrollmentAndFetchContent = async () => {
      if (!user) {
        setEnrollmentStatus('not_applied');
        setIsLoadingContent(false);
        return;
      }

      setEnrollmentStatus('checking');
      setIsLoadingContent(true);

      try {
        const application = await getCampaignApplicationForUser(user.uid, campaign.id);
        if (application) {
          setEnrollmentStatus(application.status);
          if (application.status === 'approved') {
            const [fetchedCourses, fetchedProjects, fetchedQuizzes] = await Promise.all([
              getCoursesForCampaign(campaign.id),
              getProjectsForCampaign(campaign.id),
              getQuizChallengesForCampaign(campaign.id)
            ]);
            setCourses(fetchedCourses);
            setProjects(fetchedProjects);
            setQuizzes(fetchedQuizzes);
          }
        } else {
          setEnrollmentStatus('not_applied');
        }
      } catch (error) {
        console.error("Error checking enrollment or fetching content:", error);
        setEnrollmentStatus('not_applied');
      } finally {
        setIsLoadingContent(false);
      }
    };

    if (campaign.id) {
      checkEnrollmentAndFetchContent();
    }
  }, [user, campaign.id]);

  const isEnrolled = enrollmentStatus === 'approved';
  const isLoadingInitial = enrollmentStatus === 'checking' || (isEnrolled && isLoadingContent);

  const renderContentPlaceholder = (message: string) => (
    <div className="p-6 bg-card-foreground/10 rounded-lg text-center border border-border mt-4">
      <Info className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  );

  const renderLoadingPlaceholder = (message: string) => (
     <div className="space-y-4 py-4">
        <div className="flex items-center justify-center text-muted-foreground p-4">
          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
          {message}
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
  );


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
              <span className="flex items-center"><Zap className="w-4 h-4 mr-2 text-accent" /> {campaign.requiredPoints} points for reference</span>
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
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
              <TabsTrigger value="details"><FileBadge className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Details</TabsTrigger>
              <TabsTrigger value="courses"><BookOpen className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Courses</TabsTrigger>
              <TabsTrigger value="projects"><Brain className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Projects</TabsTrigger>
              <TabsTrigger value="quizzes"><HelpCircle className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Quizzes</TabsTrigger>
              <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-2 md:hidden lg:inline-block"/>Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <h2 className="font-headline text-xl font-semibold mb-3 text-primary">About this Campaign</h2>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
            </TabsContent>

            <TabsContent value="courses">
              <h2 className="font-headline text-xl font-semibold mb-4 text-primary">Courses</h2>
              {isLoadingInitial ? (
                renderLoadingPlaceholder(enrollmentStatus === 'checking' ? 'Checking enrollment status...' : 'Loading courses...')
              ) : isEnrolled ? (
                courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map(course => <CourseItemCard key={course.id} course={course} />)}
                  </div>
                ) : (
                  renderContentPlaceholder("No courses available for this campaign yet.")
                )
              ) : (
                renderContentPlaceholder(
                  enrollmentStatus === 'pending' ? "Your application for this campaign is pending review." :
                  enrollmentStatus === 'rejected' ? "Your application for this campaign was not approved." :
                  "Enroll in this campaign to access course materials."
                )
              )}
            </TabsContent>

            <TabsContent value="projects">
              <h2 className="font-headline text-xl font-semibold mb-4 text-primary">Projects</h2>
              {isLoadingInitial ? (
                 renderLoadingPlaceholder(enrollmentStatus === 'checking' ? 'Checking enrollment status...' : 'Loading projects...')
              ) : isEnrolled ? (
                projects.length > 0 ? (
                  <p className="text-muted-foreground">Project details will appear here. ({projects.length} project(s) planned)</p>
                ) : (
                  renderContentPlaceholder("Projects for this campaign will be listed here soon.")
                )
              ) : (
                 renderContentPlaceholder(
                  enrollmentStatus === 'pending' ? "Your application for this campaign is pending review." :
                  enrollmentStatus === 'rejected' ? "Your application for this campaign was not approved." :
                  "Enroll in this campaign to access project details."
                )
              )}
            </TabsContent>

            <TabsContent value="quizzes">
              <h2 className="font-headline text-xl font-semibold mb-4 text-primary">Quizzes & Challenges</h2>
              {isLoadingInitial ? (
                 renderLoadingPlaceholder(enrollmentStatus === 'checking' ? 'Checking enrollment status...' : 'Loading quizzes...')
              ) : isEnrolled ? (
                quizzes.length > 0 ? (
                  <p className="text-muted-foreground">Quizzes and challenges will appear here. ({quizzes.length} item(s) planned)</p>
                ) : (
                   renderContentPlaceholder("Quizzes and challenges for this campaign will be listed here soon.")
                )
              ) : (
                 renderContentPlaceholder(
                  enrollmentStatus === 'pending' ? "Your application for this campaign is pending review." :
                  enrollmentStatus === 'rejected' ? "Your application for this campaign was not approved." :
                  "Enroll in this campaign to access quizzes and challenges."
                )
              )}
            </TabsContent>

            <TabsContent value="leaderboard">
              <h2 className="font-headline text-xl font-semibold mb-4 text-primary">Leaderboard</h2>
              {isLoadingInitial ? (
                renderLoadingPlaceholder(enrollmentStatus === 'checking' ? 'Checking enrollment status...' : 'Loading leaderboard...')
              ) : isEnrolled ? (
                 renderContentPlaceholder("Campaign leaderboard coming soon!")
              ) : (
                 renderContentPlaceholder(
                  enrollmentStatus === 'pending' ? "Your application for this campaign is pending review." :
                  enrollmentStatus === 'rejected' ? "Your application for this campaign was not approved." :
                  "Enroll in this campaign to view the leaderboard."
                )
              )}
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


    
