
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Target } from "lucide-react";
import { motion } from "framer-motion";
import {
  calculateExamReadiness,
  type ExamReadinessInput,
  type ExamReadinessOutput,
} from "@/ai/flows/exam-readiness";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const readinessSchema = z.object({
  hoursStudied: z.coerce.number().min(0, "Cannot be negative."),
  subject: z.string().min(2, "Please enter a subject name."),
  consistency: z.string().min(3, "Please describe your consistency."),
  quizzesSolved: z.coerce.number().min(0, "Cannot be negative."),
  deadlineProximity: z.string().min(3, "Please describe the deadline."),
});

type ReadinessFormValues = z.infer<typeof readinessSchema>;

const ScoreCircle = ({ score }: { score: number }) => (
  <div className="relative h-48 w-48 mx-auto">
    <svg className="h-full w-full" viewBox="0 0 36 36">
      <defs>
        <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(59 130 246)" />
          <stop offset="100%" stopColor="rgb(34 197 94)" />
        </linearGradient>
      </defs>
      <path
        className="text-secondary"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.8305 a 15.9155 15.9155 0 0 1 0 -31.8305"
        fill="none"
        strokeWidth="3"
      />
      <motion.path
        stroke="url(#readinessGradient)"
        strokeDasharray="100 100"
        strokeDashoffset={100}
        animate={{ strokeDashoffset: 100 - score }}
        transition={{ duration: 1, ease: "easeOut" }}
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.8305 a 15.9155 15.9155 0 0 1 0 -31.8305"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(90 18 18)"
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-5xl font-bold">{score}%</span>
      <span className="text-sm text-muted-foreground">Ready</span>
    </div>
  </div>
);

export default function AiReadinessPage() {
  const [result, setResult] = useState<ExamReadinessOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReadinessFormValues>({
    resolver: zodResolver(readinessSchema),
    defaultValues: {
      hoursStudied: 10,
      subject: "Advanced Calculus",
      consistency: "4 out of 7 days",
      quizzesSolved: 5,
      deadlineProximity: "in 1 week",
    },
  });

  async function onSubmit(data: ReadinessFormValues) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const aiResult = await calculateExamReadiness(data);
      setResult(aiResult);
    } catch (err) {
      console.error(err);
      setError("The AI failed to calculate your score. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl">
              AI Readiness Calculator
            </CardTitle>
            <CardDescription>
              Let our AI coach analyze your study habits and predict your exam
              readiness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hoursStudied"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours Studied</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quizzesSolved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice Quizzes Solved</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Advanced Calculus, History 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="consistency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Consistency</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5 out of 7 days" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                  control={form.control}
                  name="deadlineProximity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Deadline</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., in 3 days" {...field} />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Calculating..." : "Calculate My Score"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
      <div className="flex items-center justify-center">
        {isLoading && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center space-y-4">
                <Bot className="h-16 w-16 mx-auto animate-pulse text-primary" />
                <p className="text-muted-foreground">Our AI Coach is analyzing your data...</p>
            </motion.div>
        )}
        {error && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
                <Alert variant="destructive">
                    <AlertTitle>Calculation Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </motion.div>
        )}
        {result && (
            <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="text-center w-full">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl md:text-2xl">Your Readiness Score</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ScoreCircle score={result.readinessScore} />
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center justify-center gap-2">
                                <Target className="h-5 w-5 text-green-500" />
                                Coaching Tip
                            </h3>
                            <p className="text-muted-foreground italic">"{result.coachingTip}"</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )}
        {!isLoading && !result && !error && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center text-muted-foreground space-y-4 p-8">
                <Target className="h-16 w-16 mx-auto" />
                <h3 className="font-semibold text-lg">Your score will appear here</h3>
                <p>Fill out the form to get your AI-powered readiness score.</p>
            </motion.div>
        )}
      </div>
    </div>
  );
}
