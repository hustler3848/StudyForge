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
import { BookOpen, Sparkles, BrainCircuit, FileUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/flashcard-generation';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const flashcardSchema = z.object({
  notes: z.string().optional(),
  pdfFile: z.any()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
      "Only .pdf files are accepted."
    ),
}).refine(data => !!data.notes || !!data.pdfFile, {
  message: "Please either paste notes or upload a PDF file.",
  path: ["notes"], // you can set the error path to one of the fields
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
  
  const fileRef = form.register("pdfFile");

  async function onSubmit(data: FlashcardFormValues) {
    setIsLoading(true);
    setGeneratedDeck(null);
    setError(null);

    try {
      let result;
      if (data.pdfFile && data.pdfFile.size > 0) {
        const file = data.pdfFile;
        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          try {
            const uploadResult = await generateFlashcards({ pdfData: base64Data });
            setGeneratedDeck(uploadResult);
            localStorage.setItem('temp-deck', JSON.stringify(uploadResult.flashcards));
          } catch(e) {
             console.error('Error generating flashcards from PDF:', e);
             setError('Sorry, the AI failed to process the PDF. It might be corrupted or empty.');
          } finally {
             setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setError('Failed to read the PDF file.');
          setIsLoading(false);
        };
        return; // The result is handled in the onload callback
      } else if (data.notes) {
        result = await generateFlashcards({ text: data.notes });
        setGeneratedDeck(result);
        localStorage.setItem('temp-deck', JSON.stringify(result.flashcards));
      } else {
        setError("No input provided.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setError('Sorry, the AI failed to generate flashcards. Please try again.');
    } finally {
      if (!data.pdfFile || data.pdfFile.size === 0) {
        setIsLoading(false);
      }
    }
  }
  
  const startPractice = () => {
    router.push('/flashcards/practice');
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 animate-in fade-in-50">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Flashcard Generator</CardTitle>
          <CardDescription>Paste your notes or upload a PDF, and our AI will create a study deck for you.</CardDescription>
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
                          onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
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
                <p className="font-semibold">AI is extracting key concepts...</p>
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
                    We found <span className="font-bold text-primary">{generatedDeck.flashcards.length}</span> key concepts in your notes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="space-y-2">
                      <p className="font-semibold">Your new deck includes:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                          <li>Q/A Pairs</li>
                          <li>Key Definitions</li>
                          <li>Core Concepts</li>
                          <li>Mnemonics</li>
                      </ul>
                  </div>
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
                    <h3 className="font-semibold text-lg">Your new flashcard deck will appear here.</h3>
                    <p>Paste your notes or upload a PDF to get started.</p>
                </div>
            </Card>
        )}
      </div>
    </div>
  );
}
