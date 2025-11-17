'use client';

import { usePathname } from 'next/navigation';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { EssayReviewSkeleton } from '@/components/skeletons/essay-review-skeleton';
import { FlashcardsSkeleton } from '@/components/skeletons/flashcards-skeleton';
import { FocusModeSkeleton } from '@/components/skeletons/focus-mode-skeleton';
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton';
import { StudyPlanSkeleton } from '@/components/skeletons/study-plan-skeleton';
import { QuizSkeleton } from '@/components/skeletons/quiz-skeleton';

export default function Loading() {
  const pathname = usePathname();

  const renderSkeleton = () => {
    if (pathname.includes('/dashboard')) {
      return <DashboardSkeleton />;
    }
    if (pathname.includes('/essay-review')) {
      return <EssayReviewSkeleton />;
    }
    if (pathname.includes('/flashcards')) {
      return <FlashcardsSkeleton />;
    }
    if (pathname.includes('/focus-mode')) {
      return <FocusModeSkeleton />;
    }
    if (pathname.includes('/settings')) {
      return <SettingsSkeleton />;
    }
    if (pathname.includes('/study-plan')) {
      return <StudyPlanSkeleton />;
    }
    if (pathname.includes('/quiz')) {
        return <QuizSkeleton />;
    }
    // Fallback for any other pages
    return <DashboardSkeleton />;
  };

  return <div className="animate-in fade-in-50">{renderSkeleton()}</div>;
}
