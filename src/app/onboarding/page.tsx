
"use client";

import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const onboardingSchema = z.object({
  displayName: z.string().min(2, "Please enter your full name."),
  gradeLevel: z.string().min(1, "Please select your grade level."),
  subjects: z.array(z.string()).min(1, "Please add at least one subject."),
  weeklyFreeHours: z.coerce
    .number()
    .min(1, "Please enter your available hours.")
    .max(100),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

type FieldName = keyof OnboardingFormValues;

const steps = [
  {
    id: "Step 1",
    name: "Name",
    fields: ["displayName"],
  },
  {
    id: "Step 2",
    name: "Education Level",
    fields: ["gradeLevel"],
  },
  {
    id: "Step 3",
    name: "Subjects",
    fields: ["subjects"],
  },
  {
    id: "Step 4",
    name: "Availability",
    fields: ["weeklyFreeHours"],
  },
];

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
  const { user, updateUserProfile, loading } = useAuth();
  const [subjectInput, setSubjectInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: user?.displayName || "",
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
    form.setValue(
      "subjects",
      subjects.filter((s) => s !== subjectToRemove)
    );
  };

  async function processForm(data: OnboardingFormValues) {
    if (!user) return;
    
    const profileDataForFirestore = {
        displayName: data.displayName,
        profile: {
            gradeLevel: data.gradeLevel,
            subjects: data.subjects,
            weeklyFreeHours: data.weeklyFreeHours,
        },
        profileComplete: true,
    };
    
    await updateUserProfile(profileDataForFirestore);
    router.push("/dashboard");
  }

  const next = async () => {
    const fields = steps[currentStep].fields as FieldName[];
    const output = await form.trigger(fields, { shouldFocus: true });
    
    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    } else {
      await form.handleSubmit(processForm)();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-xl md:text-2xl text-center">
            Welcome to StudyForge!
          </CardTitle>
          <CardDescription className="text-center">
            Let's personalize your experience.
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 0 && (
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What should we call you?</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {currentStep === 1 && (
                    <FormField
                      control={form.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your current grade level?</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
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
                  )}
                  {currentStep === 2 && (
                    <FormItem>
                      <FormLabel>Which subjects are you studying?</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Biology, Algebra II"
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSubject();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddSubject}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 min-h-[32px]">
                        {subjects.map((subject) => (
                          <Badge
                            key={subject}
                            variant="secondary"
                            className="pl-3 pr-1 py-1 text-sm"
                          >
                            {subject}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(subject)}
                              className="ml-1 rounded-full hover:bg-background p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <FormMessage>
                        {form.formState.errors.subjects?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                  {currentStep === 3 && (
                     <FormField
                        control={form.control}
                        name="weeklyFreeHours"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>How many hours can you study per week?</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 15" {...field} />
                            </FormControl>
                            <FormDescription>
                            This helps us generate a realistic study plan for you.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <div className="w-full flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={prev}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={next}
              disabled={loading}
            >
              {currentStep === steps.length - 1
                ? loading ? "Saving..." : "Let's Get Started"
                : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
