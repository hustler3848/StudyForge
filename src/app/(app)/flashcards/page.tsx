"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BookOpen, Sparkles, BrainCircuit, FileUp, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/flashcard-generation.node';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_PDF_TYPES = ["application/pdf"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

// CLOUDINARY CONFIG
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dh3zrzgz4/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "flashcards_upload";

const flashcardSchema = z.object({
  notes: z.string().optional(),

  pdfFile: z.any()
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, "Max file size is 5MB.")
    .refine((file) => !file || ACCEPTED_PDF_TYPES.includes(file.type), "Only .pdf files are accepted."),

  imageFile: z.any()
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, "Max file size is 5MB.")
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), "Only JPG or PNG images are accepted."),
})
.refine(data => data.notes || data.pdfFile || data.imageFile, {
  message: "Please provide notes, a PDF, or an image.",
  path: ["notes"],
});

type FlashcardFormValues = z.infer<typeof flashcardSchema>;

export default function FlashcardsPage() {
  const [generatedDeck, setGeneratedDeck] = useState<GenerateFlashcardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: { notes: '' },
  });

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload image to Cloudinary.");

    const data = await res.json();
    return data.secure_url; // URL of the uploaded image
  }

  async function onSubmit(data: FlashcardFormValues) {
    setIsLoading(true);
    setGeneratedDeck(null);
    setError(null);

    try {
      // ---------------------
      // PDF UPLOAD
      // ---------------------
      if (data.pdfFile) {
        const base64 = await fileToBase64(data.pdfFile);
        const result = await generateFlashcards({ pdfData: base64 });
        setGeneratedDeck(result);
        localStorage.setItem('temp-deck', JSON.stringify(result.flashcards));
        setIsLoading(false);
        return;
      }

      // ---------------------
      // IMAGE UPLOAD (CLOUDINARY + OCR)
      // ---------------------
      if (data.imageFile) {
        try {
          const base64 = await fileToBase64(data.imageFile);
          const result = await generateFlashcards({ imageData: base64 });
          setGeneratedDeck(result);
          localStorage.setItem('temp-deck', JSON.stringify(result.flashcards));
        } catch (err) {
          console.error(err);
          setError("Failed to upload or process the image. Make sure it's clear and readable.");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ---------------------
      // TEXT INPUT
      // ---------------------
      if (data.notes) {
        const result = await generateFlashcards({ text: data.notes });
        setGeneratedDeck(result);
        localStorage.setItem('temp-deck', JSON.stringify(result.flashcards));
      }

    } catch (err) {
      console.error(err);
      setError("AI failed to generate flashcards. Try again.");
    } finally {
      if (!data.pdfFile && !data.imageFile) setIsLoading(false);
    }
  }

  const startPractice = () => router.push('/flashcards/practice');

  return (
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in-50">
      {/* LEFT FORM */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Flashcard Generator</CardTitle>
          <CardDescription>
            Paste notes, upload a PDF, or upload a picture of your notes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* NOTES INPUT */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paste Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your class notes, textbook chapter, or any text here..."
                        className="min-h-[250px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* PDF UPLOAD */}
              <FormField
                control={form.control}
                name="pdfFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload PDF</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <FileUp className="h-5 w-5 text-muted-foreground" />
                        <Input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* IMAGE UPLOAD */}
              <FormField
                control={form.control}
                name="imageFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Image (Notes Photo)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Generating Deck...' : 'Create Flashcards'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* RIGHT SIDE — PREVIEW / LOADING / ERROR */}
      <div className="space-y-6">
        {isLoading && (
          <Card className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-4">
              <BrainCircuit className="h-12 w-12 mx-auto animate-pulse text-primary" />
              <p className="font-semibold">AI is analyzing your input...</p>
              <Progress value={50} className="w-64 animate-pulse" />
            </div>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {generatedDeck && (
          <Card className="animate-in fade-in-50">
            <CardHeader className="text-center">
              <div className="mx-auto bg-green-100 p-3 rounded-full">
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="font-headline text-2xl mt-4">Deck Created!</CardTitle>
              <CardDescription>
                We found <span className="font-bold text-primary">{generatedDeck.flashcards.length}</span> key concepts.
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <p className="font-semibold">Your deck includes:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Q/A Pairs</li>
                <li>Definitions</li>
                <li>Concepts</li>
                <li>Mnemonics</li>
              </ul>

              <Button size="lg" className="w-full" onClick={startPractice}>
                Start Practicing
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !generatedDeck && !error && (
          <Card className="flex items-center justify-center min-h-[500px]">
            <div className="text-center text-muted-foreground p-8">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">
                Your generated flashcards will appear here.
              </h3>
              <p>Paste notes, upload a PDF, or upload an image.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
