
"use client";

// This is a placeholder page. The primary login page is /login.
// We redirect to /login from here.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/login');
    }, [router]);

    return (
        <div className="flex justify-center items-center h-screen">
            <p>Redirecting to login...</p>
        </div>
    );
}
