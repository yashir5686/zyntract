
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { addCourseToCampaign, getCoursesForCampaign } from '@/lib/firebase/firestore';
import type { Course } from '@/types';
import { PlusCircle, BookOpen, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ManageCoursesDialogProps {
  campaignId: string;
  setOpen: (open: boolean) => void;
}

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  // We can add resources later if needed
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function ManageCoursesDialog({ campaignId, setOpen }: ManageCoursesDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCourses, setIsFetchingCourses] = useState(true);
  const { toast } = useToast();

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      videoUrl: '',
    },
  });

  const fetchCourses = async () => {
    setIsFetchingCourses(true);
    try {
      const fetchedCourses = await getCoursesForCampaign(campaignId);
      setCourses(fetchedCourses);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching courses', description: (error as Error).message });
    } finally {
      setIsFetchingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [campaignId]);

  const onSubmit = async (data: CourseFormValues) => {
    setIsLoading(true);
    try {
      const newCourse = await addCourseToCampaign(campaignId, data);
      setCourses(prev => [...prev, newCourse]);
      toast({ title: 'Course Added!', description: `${data.title} has been added.` });
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to Add Course', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-primary" /> Manage Courses for Campaign
        </DialogTitle>
        <DialogDescription>Add new courses or view existing ones for this campaign.</DialogDescription>
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
                    <FormControl><Input placeholder="e.g., Introduction to React" {...field} /></FormControl>
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
                    <FormControl><Textarea placeholder="Brief overview of the course content..." {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl>
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
                                <CardHeader className="p-3">
                                    <CardTitle className="text-md font-semibold">{course.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                                    <p className="line-clamp-2">{course.description}</p>
                                    {course.videoUrl && (
                                        <a href={course.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs mt-1 block">
                                            Watch Video
                                        </a>
                                    )}
                                     {/* Placeholder for Edit/Delete actions */}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </section>
      </div>

      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
