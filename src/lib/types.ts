export type UserProfile = {
  gradeLevel: string;
  subjects: string[];
  examDates?: string[];
  weeklyFreeHours: number;
};

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  profileComplete: boolean;
  profile?: UserProfile;
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

export type StudyPlan = {
  id: string;
  dailySessions: {
    subject: string;
    priority: string;
    estimatedTime: string;
  }[];
  weeklyTimetable: string;
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
