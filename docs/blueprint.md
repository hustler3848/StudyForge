# **App Name**: StudyWise AI

## Core Features:

- Google Authentication: Secure user login and onboarding with Google Authentication (Firebase Auth).
- Personalized Profile Creation: Collect user's grade/class level, subjects, exam dates, and weekly free hours during onboarding and store in Firestore to facilitate personalized AI planning.
- AI Essay Feedback: Users can upload essays for grammar, readability, clarity, and structural feedback, with an option for a full corrected rewrite, leveraging Genkit and stored in Firestore.
- Smart Study Plan Generation: AI powered tool which considers upcoming tests, assignments, free time, and study goals to generate a personalized study plan with daily sessions and subject priorities. Uses Genkit.
- AI Flashcard Generation: Generates flashcards from notes or uploaded text. Uses Genkit to extract questions, answers, key definitions, concepts, and mnemonics.
- Focus Mode: Timer to enable focused study sessions with optional AI-generated motivation nudges to maintain concentration, study session stored in Firestore.
- Dashboard Statistics: Display study time, tasks due, streak, and flashcards mastered on the dashboard to track user progress and engagement.

## Style Guidelines:

- Primary color: Sky blue (#87CEEB), a calming and trustworthy color, useful to focus on academics. It invokes a sense of serenity, aiding concentration without overwhelming the user. Useful because academic study requires a sustained state of focused attention.
- Background color: Very light blue (#EBF4FA), offering a gentle backdrop that is easy on the eyes during extended study sessions.
- Accent color: Lavender (#E6E6FA) to subtly draw attention to key interface elements, suggesting creativity and imagination in learning.
- Body text font: 'PT Sans', a clear, friendly, sans-serif, making for highly readable blocks of text. Headline Font: 'Playfair' (serif), to convey trustworthiness.
- Consistent, simple icons for navigation and features (e.g., books, timers, charts).
- Clean and intuitive dashboard layout, prioritizing key features and statistics.
- Subtle animations on dashboard updates and study plan changes.