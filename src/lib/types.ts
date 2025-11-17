
export type UserProfile = {
  gradeLevel: string;
  subjects: string[];
  examDates?: string[];
  weeklyFreeHours: number;
};

export type StudyPlan = {
  dailySessions: {
    subject: string;
    priority: string;
    estimatedTime: string;
  }[];
  weeklyTimetable: string;
};

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  profileComplete: boolean;
  profile?: UserProfile;
  studyPlan?: StudyPlan;
  studyStreak?: number;
};

export type Essay = {
  id: string;
  originalText: string;
  feedback: {
    grammarScore: number;
    readabilityScore: number;
    claritySuggestions: string;
    structuralSuggestions: string;
    toneAnalysis: string;
    correctedRewrite?: string;
  };
  createdAt: Date;
};

export type Flashcard = {
  question: string;
  answer: string;
  type: 'Q/A' | 'Definition' | 'Concept' | 'Mnemonic';
};


export type FlashcardDeck = {
  id: string;
  title: string;
  flashcards: Flashcard[];
  createdAt: Date;
};

export type DailyChallenge = {
    id: string; // YYYY-MM-DD
    roomId: string;
    question: string;
};

export type ChallengeAnswer = {
    id: string;
    challengeId: string;
    userId: string;
    answer: string;
    isCorrect: boolean;
    feedback: string;
    submittedAt: Date;
};
    
