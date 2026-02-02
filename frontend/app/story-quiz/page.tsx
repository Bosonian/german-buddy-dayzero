'use client';

import Navigation from '@/components/Navigation';
import StoryPersonalityQuiz from '@/components/StoryPersonalityQuiz';

export default function StoryQuizPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <main className="pt-16 pb-20">
        <StoryPersonalityQuiz />
      </main>
    </div>
  );
}
