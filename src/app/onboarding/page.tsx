"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

const onboardingSchema = z.object({
  gradeLevel: z.string().min(1, "Please select your grade level."),
  subjects: z.array(z.string()).min(1, "Please add at least one subject."),
  weeklyFreeHours: z.coerce.number().min(1, "Please enter your available hours.").max(100),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const gradeLevels = [
  "Middle School",
  "High School Freshman",
  "High School Sophomore",
  "High School Junior",
  "High School Senior",
  "College Freshman",
  "College Sophomore",
  "College Junior",
  "College Senior",
  "Graduate Student",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const [subjectInput, setSubjectInput] = useState("");

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      gradeLevel: "",
      subjects: [],
      weeklyFreeHours: 10,
    },
  });

  const subjects = form.watch("subjects");

  const handleAddSubject = () => {
    if (subjectInput.trim() && !subjects.includes(subjectInput.trim())) {
      form.setValue("subjects", [...subjects, subjectInput.trim()]);
      setSubjectInput("");
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    form.setValue("subjects", subjects.filter(s => s !== subjectToRemove));
  };


  function onSubmit(data: OnboardingFormValues) {
    if (!user) return;
    
    // In a real app, you'd save this to Firestore
    console.log("Onboarding data:", data);

    updateUserProfile({ profileComplete: true, profile: data });
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome to StudyWise AI!</CardTitle>
          <CardDescription>
            Let's personalize your experience. Tell us a bit about yourself.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade/Class Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gradeLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Subjects</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Biology, Algebra II"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddSubject}>Add</Button>
                </div>
                 <div className="flex flex-wrap gap-2 mt-2">
                  {subjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                      {subject}
                      <button type="button" onClick={() => handleRemoveSubject(subject)} className="ml-1 rounded-full hover:bg-background p-0.5">
                        <X className="h-3 w-3"/>
                      </button>
                    </Badge>
                  ))}
                </div>
                 <FormMessage>{form.formState.errors.subjects?.message}</FormMessage>
              </FormItem>

              <FormField
                control={form.control}
                name="weeklyFreeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Free Hours for Study</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 15" {...field} />
                    </FormControl>
                    <FormDescription>
                      How many hours can you dedicate to studying each week?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg">
                Let's Get Started
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
