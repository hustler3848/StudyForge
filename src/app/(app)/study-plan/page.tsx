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
import { Bot, Calendar, Plus, Trash2, Timer } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { generateStudyPlan, type GenerateStudyPlanOutput } from '@/ai/flows/smart-study-plan';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const studyPlanSchema = z.object({
  tasks: z.array(z.object({ value: z.string().min(1, 'Task cannot be empty.') })).min(1, 'Please add at least one task.'),
  freeHours: z.array(z.object({ value: z.string().min(1, 'Time slot cannot be empty.') })).min(1, 'Please add at least one free time slot.'),
  studyGoals: z.string().min(10, 'Please describe your study goals.'),
});

type StudyPlanFormValues = z.infer<typeof studyPlanSchema>;

const subjectColors: { [key: string]: string } = {
  default: 'bg-gray-200 text-gray-800',
  math: 'bg-blue-100 text-blue-800',
  science: 'bg-green-100 text-green-800',
  history: 'bg-yellow-100 text-yellow-800',
  english: 'bg-purple-100 text-purple-800',
  biology: 'bg-green-200 text-green-900',
  chemistry: 'bg-indigo-100 text-indigo-800',
  physics: 'bg-sky-100 text-sky-800',
  literature: 'bg-pink-100 text-pink-800',
  algebra: 'bg-blue-200 text-blue-900',
};

const getColorForSubject = (subject: string) => {
  const lowerCaseSubject = subject.toLowerCase();
  for (const key in subjectColors) {
    if (lowerCaseSubject.includes(key)) {
      return subjectColors[key];
    }
  }
  return subjectColors.default;
};

type ParsedSession = {
  time: string;
  subject: string;
  task: string;
};

type ParsedDay = {
  day: string;
  sessions: ParsedSession[];
};

const parseTimetable = (timetable: string): ParsedDay[] => {
    if (!timetable) return [];
    const days = timetable.split(/(?=Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/);
    return days.filter(day => day.trim()).map(dayString => {
        const lines = dayString.trim().split('\n');
        const day = lines[0].replace(':', '').trim();
        const sessions = lines.slice(1).map(line => {
            const match = line.match(/-\s(.*?):\s(.*?)\s\((.*?)\)/);
            if (match) {
                return { time: match[1], subject: match[2], task: match[3] };
            }
            return null;
        }).filter((s): s is ParsedSession => s !== null);
        return { day, sessions };
    });
};


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

  const parsedWeeklyPlan = plan ? parseTimetable(plan.weeklyTimetable) : [];

  return (
    <div className="grid gap-8 lg:grid-cols-3 animate-in fade-in-50">
      <Card className="shadow-lg lg:col-span-1">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create Your Study Plan</CardTitle>
          <CardDescription>Tell the AI about your goals and schedule to generate a personalized plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <FormLabel className="text-sm font-medium">Upcoming Tests & Assignments</FormLabel>
                <div className="space-y-2 mt-2">
                    {taskFields.map((field, index) => (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={`tasks.${index}.value`}
                        render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
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
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTask({ value: '' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
                 <FormMessage className="mt-1">{form.formState.errors.tasks?.message}</FormMessage>
              </div>

              <div>
                <FormLabel className="text-sm font-medium">Free Time Slots</FormLabel>
                <div className="space-y-2 mt-2">
                    {freeHourFields.map((field, index) => (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={`freeHours.${index}.value`}
                        render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
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
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendFreeHour({ value: '' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Slot
                </Button>
                <FormMessage className="mt-1">{form.formState.errors.freeHours?.message}</FormMessage>
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
      
      <div className="space-y-6 lg:col-span-2">
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
                        <h3 className="font-semibold mb-4 flex items-center gap-2"><Timer /> Daily Session Priorities</h3>
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
                                    <TableCell className="font-medium">{session.subject}</TableCell>
                                    <TableCell>
                                    <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', {
                                        'bg-red-100 text-red-800': session.priority === 'high',
                                        'bg-yellow-100 text-yellow-800': session.priority === 'medium',
                                        'bg-green-100 text-green-800': session.priority === 'low'
                                    })}>
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
                        <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar /> Weekly Timetable</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                            {parsedWeeklyPlan.map(day => (
                                <div key={day.day} className="bg-secondary/50 rounded-lg p-3">
                                    <h4 className="font-bold text-center mb-4">{day.day}</h4>
                                    <div className="space-y-2">
                                        {day.sessions.length > 0 ? day.sessions.map((session, index) => (
                                            <div key={index} className={cn("p-2 rounded-md", getColorForSubject(session.subject))}>
                                                <p className="font-bold text-sm">{session.time}</p>
                                                <p className="font-semibold text-xs">{session.subject}</p>
                                                <p className="text-xs opacity-80">{session.task}</p>
                                            </div>
                                        )) : (
                                            <div className="text-center text-xs text-muted-foreground p-4">
                                                <p>Free Day!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
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
