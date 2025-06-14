
'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { addCourseToCampaign, getCoursesForCampaign, getCertificatesForCourseForAdmin } from '@/lib/firebase/firestore';
import type { Course, UserCourseCertificate } from '@/types';
import { PlusCircle, BookOpen, Loader2, LinkIcon, Eye, CheckSquare, XSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CourseSubmissionsReviewDialog from './CourseSubmissionsReviewDialog';

interface ManageCoursesDialogProps {
  campaignId: string;
  setOpen: (open: boolean) => void;
}

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  courseUrl: z.string().url('Must be a valid URL for the course.'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseWithSubmissionCount extends Course {
  reviewCount: number;
}


export default function ManageCoursesDialog({ campaignId, setOpen }: ManageCoursesDialogProps) {
  const [courses, setCourses] = useState<CourseWithSubmissionCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCourses, setIsFetchingCourses] = useState(true);
  const { toast } = useToast();
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<Course | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      courseUrl: '',
    },
  });

  const fetchCoursesWithSubmissionCounts = async () => {
    setIsFetchingCourses(true);
    try {
      const fetchedCourses = await getCoursesForCampaign(campaignId);
      const coursesWithCounts = await Promise.all(
        fetchedCourses.map(async (course) => {
          const submissions = await getCertificatesForCourseForAdmin(course.id);
          const reviewCount = submissions.filter(s => s.status === 'review').length;
          return { ...course, reviewCount };
        })
      );
      setCourses(coursesWithCounts);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching courses', description: (error as Error).message });
    } finally {
      setIsFetchingCourses(false);
    }
  };

  useEffect(() => {
    fetchCoursesWithSubmissionCounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const onSubmit = async (data: CourseFormValues) => {
    setIsLoading(true);
    try {
      await addCourseToCampaign(campaignId, data);
      toast({ title: 'Course Added!', description: `${data.title} has been added.` });
      form.reset();
      fetchCoursesWithSubmissionCounts(); // Refresh list
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to Add Course', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewDialog = (course: Course) => {
    setSelectedCourseForReview(course);
    setIsReviewDialogOpen(true);
  };
  
  const handleSubmissionsUpdated = () => {
    // This function will be called by CourseSubmissionsReviewDialog when submissions are updated.
    // Re-fetch courses to update review counts.
    fetchCoursesWithSubmissionCounts();
  };


  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-primary" /> Manage Courses for Campaign
        </DialogTitle>
        <DialogDescription>Add new courses or view existing ones for this campaign. Admins can review submitted certificates.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh]">
        <section className="md:border-r md:pr-6">
          <h3 className="font-headline text-lg mb-3">Add New Course</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Advanced JavaScript Techniques" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Detailed overview of what the course covers..." {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course URL</FormLabel>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl><Input placeholder="https://yoursite.com/course-link" {...field} className="pl-10" /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Course
              </Button>
            </form>
          </Form>
        </section>
        
        <section>
            <h3 className="font-headline text-lg mb-3">Existing Courses ({courses.length})</h3>
            <ScrollArea className="h-[400px] pr-3">
                {isFetchingCourses ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : courses.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No courses added to this campaign yet.</p>
                ) : (
                    <div className="space-y-3">
                        {courses.map(course => (
                            <Card key={course.id} className="bg-card-foreground/5">
                                <CardHeader className="p-3 pb-1">
                                    <CardTitle className="text-md font-semibold">{course.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                                    <p className="line-clamp-2 mb-1">{course.description}</p>
                                    <a href={course.courseUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-medium flex items-center">
                                        <LinkIcon className="w-3 h-3 mr-1" /> View Course Page
                                    </a>
                                </CardContent>
                                <CardFooter className="p-3 pt-0">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full text-xs"
                                      onClick={() => handleOpenReviewDialog(course)}
                                    >
                                        <Eye className="w-3 h-3 mr-1.5"/> 
                                        Review Submissions 
                                        {course.reviewCount > 0 && (
                                          <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-[10px] leading-none">{course.reviewCount}</Badge>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </section>
      </div>

      {selectedCourseForReview && (
        <Dialog open={isReviewDialogOpen} onOpenChange={(open) => {
          setIsReviewDialogOpen(open);
          if (!open) setSelectedCourseForReview(null);
        }}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh]"> {/* Adjusted width */}
            <CourseSubmissionsReviewDialog 
              courseId={selectedCourseForReview.id} 
              courseTitle={selectedCourseForReview.title}
              setOpen={setIsReviewDialogOpen}
              onSubmissionsUpdated={handleSubmissionsUpdated}
            />
          </DialogContent>
        </Dialog>
      )}


      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
