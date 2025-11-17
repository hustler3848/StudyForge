
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  generateStudyPlan,
  type GenerateStudyPlanOutput,
} from "@/ai/flows/smart-study-plan";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const studyPlanSchema = z.object({
  tasks: z
    .array(z.object({ value: z.string().min(1, "Task cannot be empty.") }))
    .min(1, "Please add at least one task."),
  freeHours: z
    .array(
      z.object({ value: z.string().min(1, "Time slot cannot be empty.") })
    )
    .min(1, "Please add at least one free time slot."),
  studyGoals: z.string().min(10, "Please describe your study goals."),
});

type StudyPlanFormValues = z.infer<typeof studyPlanSchema>;

const subjectColors: { [key: string]: string } = {
  default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  math: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  science: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  history: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  english: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  biology: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  chemistry: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
  physics: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
  literature: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
  algebra: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
  economics: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  finance: "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300",
  art: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
};

const getColorForSubject = (subject: string) => {
  const lowerCaseSubject = subject.toLowerCase();
  for (const key in subjectColors) {
    if (lowerCaseSubject.includes(key) && key !== 'default') {
      return subjectColors[key];
    }
  }
  return subjectColors.default;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export default function StudyPlanPage() {
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GenerateStudyPlanOutput | null>(user.studyPlan || null);

  const form = useForm<StudyPlanFormValues>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      tasks: [{ value: "" }],
      freeHours: [{ value: "" }],
      studyGoals: "",
    },
  });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({ control: form.control, name: "tasks" });
  const { fields: freeHourFields, append: appendFreeHour, remove: removeFreeHour } = useFieldArray({ control: form.control, name: "freeHours" });

  async function onSubmit(data: StudyPlanFormValues) {
    if (!user || !user.profile) return;
    setIsLoading(true);
    setError(null);

    const input = {
      profile: {
        gradeLevel: user.profile.gradeLevel,
        subjects: user.profile.subjects,
        weeklyFreeHours: user.profile.weeklyFreeHours,
      },
      tasks: data.tasks.map((t) => t.value),
      freeHours: data.freeHours.map((f) => f.value),
      studyGoals: data.studyGoals,
    };

    try {
      const result = await generateStudyPlan(input);
      setGeneratedPlan(result);
      await updateUserProfile({ studyPlan: result });
    } catch (error) {
      console.error("Error generating study plan:", error);
      setError("Sorry, the AI failed to generate a study plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="lg:col-span-1 space-y-6" variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl md:text-2xl">
                Generate Your Study Plan
              </CardTitle>
              <CardDescription>
                Fill out the details below and let our AI create a schedule for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <FormLabel className="text-sm font-medium">Upcoming Tests & Assignments</FormLabel>
                    <div className="space-y-2 mt-2">
                      {taskFields.map((field, index) => (
                        <FormField key={field.id} control={form.control} name={`tasks.${index}.value`} render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Input placeholder={`e.g., Math test on Friday`} {...field} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(index)} disabled={taskFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTask({ value: "" })}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
                    <FormMessage className="mt-1">{form.formState.errors.tasks?.message}</FormMessage>
                  </div>
                  <div>
                    <FormLabel className="text-sm font-medium">Free Time Slots</FormLabel>
                    <div className="space-y-2 mt-2">
                      {freeHourFields.map((field, index) => (
                        <FormField key={field.id} control={form.control} name={`freeHours.${index}.value`} render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Input placeholder={`e.g., Monday 4-6 PM`} {...field} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFreeHour(index)} disabled={freeHourFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendFreeHour({ value: "" })}><Plus className="mr-2 h-4 w-4" /> Add Slot</Button>
                    <FormMessage className="mt-1">{form.formState.errors.freeHours?.message}</FormMessage>
                  </div>
                  <FormField control={form.control} name="studyGoals" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Goals</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Ace my history midterm, improve my essay writing skills..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Generating..." : "Generate AI Plan"}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-1" variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl md:text-2xl">Your Generated Plan</CardTitle>
            </CardHeader>
            <CardContent>
             <AnimatePresence mode="wait">
              {error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="my-4">
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {generatedPlan ? (
                  <motion.div
                    key="plan"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                        <h3 className="font-semibold mb-2">Daily Session Focus</h3>
                        <ul className="space-y-2">
                            {generatedPlan.dailySessions.map((session, index) =>(
                                <li key={index} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                                    <span className={cn("font-semibold px-2 py-1 rounded-md text-sm", getColorForSubject(session.subject))}>{session.subject}</span>
                                    <span className="text-sm text-muted-foreground">{session.estimatedTime}</span>
                                    <span
                                      className={cn(
                                        "px-2 py-1 text-xs font-semibold rounded-full capitalize",
                                        {
                                          "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300":
                                            session.priority.toLowerCase() === "high",
                                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300":
                                            session.priority.toLowerCase() === "medium",
                                          "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300":
                                            session.priority.toLowerCase() === "low",
                                        }
                                      )}
                                    >
                                        {session.priority}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Weekly Timetable</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary p-4 rounded-lg">{generatedPlan.weeklyTimetable}</p>
                    </div>
                  </motion.div>
              ) : (
                <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-muted-foreground py-16"
                >
                    <p>Your AI-generated study plan will appear here.</p>
                </motion.div>
              )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
  );
}
