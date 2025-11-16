"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bot, Calendar, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { generateStudyPlan, type GenerateStudyPlanOutput } from '@/ai/flows/smart-study-plan';
import { Separator } from '@/components/ui/separator';

const studyPlanSchema = z.object({
  tasks: z.array(z.object({ value: z.string().min(1, 'Task cannot be empty.') })).min(1, 'Please add at least one task.'),
  freeHours: z.array(z.object({ value: z.string().min(1, 'Time slot cannot be empty.') })).min(1, 'Please add at least one free time slot.'),
  studyGoals: z.string().min(10, 'Please describe your study goals.'),
});

type StudyPlanFormValues = z.infer<typeof studyPlanSchema>;

export default function StudyPlanPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<GenerateStudyPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StudyPlanFormValues>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      tasks: [{ value: '' }],
      freeHours: [{ value: '' }],
      studyGoals: '',
    },
  });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });

  const { fields: freeHourFields, append: appendFreeHour, remove: removeFreeHour } = useFieldArray({
    control: form.control,
    name: 'freeHours',
  });

  async function onSubmit(data: StudyPlanFormValues) {
    if (!user || !user.profile) return;
    setIsLoading(true);
    setPlan(null);

    const input = {
        profile: {
            gradeLevel: user.profile.gradeLevel,
            subjects: user.profile.subjects,
            weeklyFreeHours: user.profile.weeklyFreeHours,
        },
        tasks: data.tasks.map(t => t.value),
        freeHours: data.freeHours.map(f => f.value),
        studyGoals: data.studyGoals,
    };
    
    try {
      const result = await generateStudyPlan(input);
      setPlan(result);
    } catch (error) {
      console.error('Error generating study plan:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 animate-in fade-in-50">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create Your Study Plan</CardTitle>
          <CardDescription>Tell the AI about your goals and schedule to generate a personalized plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <FormLabel>Upcoming Tests & Assignments</FormLabel>
                {taskFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`tasks.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 mt-2">
                        <FormControl>
                          <Input placeholder={`e.g., Math test on Friday`} {...field} />
                        </FormControl>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(index)} disabled={taskFields.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTask({ value: '' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
                 <FormMessage>{form.formState.errors.tasks?.message}</FormMessage>
              </div>

              <div>
                <FormLabel>Free Time Slots</FormLabel>
                {freeHourFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`freeHours.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 mt-2">
                        <FormControl>
                          <Input placeholder={`e.g., Monday 4-6 PM`} {...field} />
                        </FormControl>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFreeHour(index)} disabled={freeHourFields.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendFreeHour({ value: '' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Slot
                </Button>
                <FormMessage>{form.formState.errors.freeHours?.message}</FormMessage>
              </div>
              
              <FormField
                control={form.control}
                name="studyGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Goals</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Ace my history midterm, improve my essay writing skills..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Generating Plan...' : 'Generate My Plan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {isLoading && (
            <Card className="flex items-center justify-center min-h-[500px]">
                <div className="text-center space-y-4 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="font-semibold">AI is crafting your personalized study plan...</p>
                    <p className="text-sm">This might take a moment.</p>
                </div>
            </Card>
        )}
        
        {plan && (
            <Card className="shadow-lg animate-in fade-in-50">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Your Smart Study Plan</CardTitle>
                    <CardDescription>A tailored plan to help you achieve your goals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Daily Session Priorities</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plan.dailySessions.map((session, index) => (
                                <TableRow key={index}>
                                    <TableCell>{session.subject}</TableCell>
                                    <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        session.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                        session.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {session.priority}
                                    </span>
                                    </TableCell>
                                    <TableCell>{session.estimatedTime}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2">Weekly Timetable</h3>
                        <div className="prose prose-sm max-w-none bg-secondary p-4 rounded-md whitespace-pre-wrap font-mono text-xs">
                            {plan.weeklyTimetable}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {!isLoading && !plan && (
            <Card className="flex items-center justify-center min-h-[500px]">
                <div className="text-center text-muted-foreground p-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">Your study plan will appear here.</h3>
                    <p>Fill out the form to generate your schedule.</p>
                </div>
            </Card>
        )}
      </div>
    </div>
  );
}
