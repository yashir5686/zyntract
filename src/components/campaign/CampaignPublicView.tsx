
'use client';

import type { Campaign, CampaignApplication, Course, Project, QuizChallenge } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CalendarDays, Zap, CheckCircle, Info, ExternalLink, ListChecks, Trophy, Users, Brain, Loader2, BookOpen, Video, FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getCampaignApplicationForUser, getCoursesForCampaign, getProjectsForCampaign, getQuizChallengesForCampaign } from '@/lib/firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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
        {course.videoUrl && (
          <Button asChild variant="link" className="p-0 h-auto text-primary">
            <a href={course.videoUrl} target="_blank" rel="noopener noreferrer">
              <Video className="w-4 h-4 mr-1" /> Watch Video
            </a>
          </Button>
        )}
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
              getProjectsForCampaign(campaign.id), // Assuming these are implemented
              getQuizChallengesForCampaign(campaign.id) // Assuming these are implemented
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
        setEnrollmentStatus('not_applied'); // Or an error state
      } finally {
        setIsLoadingContent(false);
      }
    };

    if (campaign.id) {
      checkEnrollmentAndFetchContent();
    }
  }, [user, campaign.id]);

  const isEnrolled = enrollmentStatus === 'approved';

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
            
            {enrollmentStatus === 'checking' || (isEnrolled && isLoadingContent) ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center text-muted-foreground p-4">
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  {enrollmentStatus === 'checking' ? 'Checking enrollment status...' : 'Loading campaign content...'}
                </div>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : isEnrolled ? (
              <div className="space-y-6">
                {/* Courses Section */}
                <div>
                  <h3 className="font-headline text-lg font-semibold mb-3 flex items-center"><ListChecks className="w-5 h-5 mr-2 text-accent" /> Courses</h3>
                  {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map(course => <CourseItemCard key={course.id} course={course} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No courses available for this campaign yet.</p>
                  )}
                </div>

                {/* Projects Section - Placeholder */}
                <div>
                  <h3 className="font-headline text-lg font-semibold mb-3 flex items-center"><Brain className="w-5 h-5 mr-2 text-accent" /> Projects</h3>
                  {projects.length > 0 ? (
                     <p className="text-muted-foreground">Project details will appear here. ({projects.length} project(s) planned)</p>
                  ) : (
                    <p className="text-muted-foreground">Projects for this campaign will be listed here soon.</p>
                  )}
                </div>

                {/* Quizzes & Challenges Section - Placeholder */}
                <div>
                  <h3 className="font-headline text-lg font-semibold mb-3 flex items-center"><HelpCircle className="w-5 h-5 mr-2 text-accent" /> Quizzes & Challenges</h3>
                   {quizzes.length > 0 ? (
                     <p className="text-muted-foreground">Quizzes and challenges will appear here. ({quizzes.length} item(s) planned)</p>
                  ) : (
                    <p className="text-muted-foreground">Quizzes and challenges for this campaign will be listed here soon.</p>
                  )}
                </div>

                {/* Leaderboard Section - Placeholder */}
                <div>
                  <h3 className="font-headline text-lg font-semibold mb-3 flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Leaderboard</h3>
                  <p className="text-muted-foreground">Campaign leaderboard coming soon!</p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-card-foreground/10 rounded-lg text-center border border-border">
                <Info className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                 {enrollmentStatus === 'pending' && (
                    <p className="text-yellow-600 font-medium mb-2">Your application for this campaign is pending review.</p>
                 )}
                 {enrollmentStatus === 'rejected' && (
                    <p className="text-red-600 font-medium mb-2">Your application for this campaign was not approved at this time.</p>
                 )}
                <p className="text-muted-foreground font-medium">
                  Detailed information and interactive sections will be available here for enrolled participants.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  This includes: Courses, Projects, Quizzes & Challenges, and Leaderboards.
                </p>
              </div>
            )}
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
