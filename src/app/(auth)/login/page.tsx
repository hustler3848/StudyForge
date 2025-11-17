
"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/use-auth";
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: SignInFormValues) {
    setError(null);
    try {
      await signInWithEmail(data.email, data.password);
      router.push('/dashboard');
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-credential':
          setError('Incorrect email or password. Please try again.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          break;
      }
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm md:max-w-4xl"
    >
      <Card className="w-full md:grid md:grid-cols-2 overflow-hidden shadow-none md:shadow-lg">
        <div className="relative hidden md:block">
          <Image
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Students studying in a library"
            width={800}
            height={1200}
            className="h-full w-full object-cover"
            data-ai-hint="library books"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        <div className="p-4 sm:p-8 flex flex-col justify-center">
            <CardHeader className="text-center p-0 mb-6">
              <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your study tools.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className={cn(
                      "w-full text-white font-bold bg-gradient-to-r from-indigo-500 to-blue-400 hover:from-indigo-600 hover:to-blue-500"
                    )}
                    disabled={loading}
                  >
                    {loading ? 'Logging In...' : 'Login'}
                  </Button>
                </form>
              </Form>
              <div className="space-y-4">
                <div className="text-center text-sm">
                    <p>Don't have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link></p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <GoogleIcon />
                  Sign in with Google
                </Button>
              </div>
            </CardContent>
          </div>
      </Card>
    </motion.div>
  );
}
