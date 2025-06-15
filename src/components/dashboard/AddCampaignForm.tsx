
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { addCampaign } from '@/lib/firebase/firestore';
import type { Campaign } from '@/types';
import { CalendarIcon, LinkIcon, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const campaignSchema = z.object({
  name: z.string().min(3, { message: 'Campaign name must be at least 3 characters.' }).max(100),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(10000),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  registrationEndDate: z.date().optional(), // New optional field
  status: z.enum(['upcoming', 'ongoing', 'past'], { required_error: "Status is required." }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  applyLink: z.string().url({ message: "Please enter a valid URL for the application link." }).optional().or(z.literal('')),
  requiredPoints: z.coerce.number().int().min(0).optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be earlier than start date.",
  path: ["endDate"],
}).refine(data => { // Registration end date must be before or on end date
  if (data.registrationEndDate) {
    return data.registrationEndDate <= data.endDate;
  }
  return true;
}, {
  message: "Registration end date cannot be after campaign end date.",
  path: ["registrationEndDate"],
}).refine(data => { // Registration end date ideally before or on start date, but can be after for flexibility
  if (data.registrationEndDate && data.startDate) {
    return true; // Allow registration end date to be after start date if needed
  }
  return true;
}, {
  message: "Registration end date should ideally be before or on the start date.",
  path: ["registrationEndDate"],
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface AddCampaignFormProps {
  onCampaignAdded: () => void;
  setOpen: (open: boolean) => void;
}

export default function AddCampaignForm({ onCampaignAdded, setOpen }: AddCampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'upcoming',
      imageUrl: '',
      applyLink: '',
      requiredPoints: 0,
      registrationEndDate: undefined,
    },
  });

  const onSubmit = async (data: CampaignFormValues) => {
    setIsLoading(true);
    try {
      const campaignData: Omit<Campaign, 'id' | 'createdAt'> = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        registrationEndDate: data.registrationEndDate ? data.registrationEndDate.toISOString() : undefined,
        applyLink: data.applyLink || undefined,
        requiredPoints: data.requiredPoints || 0,
      };
      await addCampaign(campaignData);
      toast({ title: 'Campaign Added!', description: `${data.name} has been successfully created.` });
      onCampaignAdded();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Add Campaign', description: error.message || 'Could not create campaign.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Summer Code Fest" {...field} />
              </FormControl>
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
              <FormControl>
                <Textarea placeholder="Detailed description of the campaign..." {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="registrationEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Registration End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Leave blank to use Start Date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="applyLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External Application Link (Optional)</FormLabel>
               <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="https://forms.gle/your-form-link" {...field} className="pl-10"/>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="requiredPoints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Points (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Adding Campaign...' : <><PlusCircle className="mr-2 h-4 w-4" /> Add Campaign</>}
        </Button>
      </form>
    </Form>
  );
}
