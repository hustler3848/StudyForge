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
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const flashcardSchema = z.object({
  notes: z.string().optional(),

  pdfFile: z.instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, "Max file size is 5MB.")
    .refine((file) => !file || ACCEPTED_PDF_TYPES.includes(file.type), "Only .pdf files are accepted."),

  imageFile: z.instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, "Max file size is 5MB.")
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), "Only JPG, PNG, or WEBP images are accepted."),
})
.refine(data => data.notes || data.pdfFile || data.imageFile, {
  message: "Please provide notes, a PDF, or an image.",
  path: ["notes"], // Show error under the notes field
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
      // Return the base64 string, excluding the data URI prefix
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(data: FlashcardFormValues) {
    setIsLoading(true);
    setGeneratedDeck(null);
    setError(null);

    try {
      let result;
      if (data.imageFile) {
        const base64Image = await fileToBase64(data.imageFile);
        result = await generateFlashcards({ imageData: base64Image });
      } else if (data.pdfFile) {
        const base64Pdf = await fileToBase64(data.pdfFile);
        result = await generateFlashcards({ pdfData: base64Pdf });
      } else if (data.notes) {
        result = await generateFlashcards({ text: data.notes });
      } else {
        setError("Please provide some input.");
        setIsLoading(false);
        return;
      }
      
      setGeneratedDeck(result);
      if (result && result.flashcards) {
        localStorage.setItem('temp-deck', JSON.stringify(result.flashcards));
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`AI failed to generate flashcards. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }

  const startPractice = () => router.push('/flashcards/practice');

  return (
    <div className="grid gap-8 md:grid-cols-2 animate-in fade-in-50">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Flashcard Generator</CardTitle>
          <CardDescription>
            Paste notes, upload a PDF, or upload a picture of your notes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paste Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your class notes, textbook chapter, or any text here..."
                        className="min-h-[200px] resize-y"
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

              <FormField
                control={form.control}
                name="pdfFile"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload PDF</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <FileUp className="h-5 w-5 text-muted-foreground" />
                        <Input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => onChange(e.target.files?.[0])}
                          {...rest}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageFile"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Image (Notes Photo)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={(e) => onChange(e.target.files?.[0])}
                          {...rest}
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
          <Card className="shadow-lg animate-in fade-in-50">
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
