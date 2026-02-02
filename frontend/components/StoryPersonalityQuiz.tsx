'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  ChevronRight,
  RotateCcw,
  Share2,
  Brain,
  Heart,
  Users,
  Target,
  Zap,
  CheckCircle2,
  Globe
} from 'lucide-react';

interface Choice {
  id: string;
  german: string;
  english: string;
  scores: Record<string, number>;
  nextScene: string;
}

interface Scene {
  id: string;
  chapterId: number;
  type: 'narrative' | 'decision';
  german: string;
  english: string;
  nextScene?: string;
  choices?: Choice[];
}

interface Chapter {
  id: number;
  title: string;
  titleEnglish: string;
}

interface TraitDescription {
  name: string;
  nameEnglish: string;
  high: { german: string; english: string };
  medium: { german: string; english: string };
  low: { german: string; english: string };
}

interface VocabItem {
  german: string;
  english: string;
}

interface StoryData {
  id: string;
  title: string;
  titleEnglish: string;
  description: string;
  descriptionEnglish: string;
  level: string;
  estimatedMinutes: number;
  chapters: Chapter[];
  scenes: Scene[];
  traitDescriptions: Record<string, TraitDescription>;
  vocabulary: VocabItem[];
}

interface PersonalityScores {
  O: number; // Openness
  C: number; // Conscientiousness
  E: number; // Extraversion
  A: number; // Agreeableness
  N: number; // Neuroticism
}

const TRAIT_ICONS: Record<string, React.ReactNode> = {
  O: <Sparkles className="w-5 h-5" />,
  C: <Target className="w-5 h-5" />,
  E: <Users className="w-5 h-5" />,
  A: <Heart className="w-5 h-5" />,
  N: <Zap className="w-5 h-5" />,
};

const TRAIT_COLORS: Record<string, { from: string; to: string; bg: string }> = {
  O: { from: 'from-purple-500', to: 'to-pink-500', bg: 'bg-purple-500' },
  C: { from: 'from-blue-500', to: 'to-cyan-500', bg: 'bg-blue-500' },
  E: { from: 'from-orange-500', to: 'to-yellow-500', bg: 'bg-orange-500' },
  A: { from: 'from-green-500', to: 'to-emerald-500', bg: 'bg-green-500' },
  N: { from: 'from-red-500', to: 'to-rose-500', bg: 'bg-red-500' },
};

export default function StoryPersonalityQuiz() {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('intro');
  const [scores, setScores] = useState<PersonalityScores>({ O: 0, C: 0, E: 0, A: 0, N: 0 });
  const [decisionsHistory, setDecisionsHistory] = useState<{ sceneId: string; choiceId: string }[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [animatingChoice, setAnimatingChoice] = useState<string | null>(null);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'story' | 'results'>('intro');

  useEffect(() => {
    loadStoryData();
  }, []);

  const loadStoryData = async () => {
    try {
      const response = await fetch('/data/personality_story.json');
      const data = await response.json();
      setStoryData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load story data:', error);
      setIsLoading(false);
    }
  };

  const getCurrentScene = (): Scene | null => {
    if (!storyData) return null;
    return storyData.scenes.find(s => s.id === currentSceneId) || null;
  };

  const getCurrentChapter = (): Chapter | null => {
    const scene = getCurrentScene();
    if (!scene || !storyData) return null;
    return storyData.chapters.find(c => c.id === scene.chapterId) || null;
  };

  const handleChoice = (choice: Choice) => {
    setAnimatingChoice(choice.id);

    // Update scores
    const newScores = { ...scores };
    Object.entries(choice.scores).forEach(([trait, value]) => {
      newScores[trait as keyof PersonalityScores] += value;
    });
    setScores(newScores);

    // Record decision
    setDecisionsHistory([...decisionsHistory, { sceneId: currentSceneId, choiceId: choice.id }]);

    // Navigate to next scene after animation
    setTimeout(() => {
      setAnimatingChoice(null);
      if (choice.nextScene === 'results') {
        setShowResults(true);
        setPhase('results');
      } else {
        setCurrentSceneId(choice.nextScene);
      }
    }, 400);
  };

  const handleContinue = () => {
    const scene = getCurrentScene();
    if (scene?.nextScene) {
      if (scene.nextScene === 'results') {
        setShowResults(true);
        setPhase('results');
      } else {
        setCurrentSceneId(scene.nextScene);
      }
    }
  };

  const startStory = () => {
    setPhase('story');
    setCurrentSceneId('intro');
  };

  const restartQuiz = () => {
    setScores({ O: 0, C: 0, E: 0, A: 0, N: 0 });
    setDecisionsHistory([]);
    setCurrentSceneId('intro');
    setShowResults(false);
    setPhase('intro');
  };

  const calculatePercentages = (): Record<string, number> => {
    // Normalize scores to percentages (0-100)
    // Each trait can have max ~10-14 points (positive or negative)
    const maxScore = 14;
    const percentages: Record<string, number> = {};

    Object.entries(scores).forEach(([trait, score]) => {
      // Convert from range [-maxScore, +maxScore] to [0, 100]
      percentages[trait] = Math.round(((score + maxScore) / (2 * maxScore)) * 100);
      // Clamp to 0-100
      percentages[trait] = Math.max(0, Math.min(100, percentages[trait]));
    });

    return percentages;
  };

  const getTraitLevel = (percentage: number): 'high' | 'medium' | 'low' => {
    if (percentage >= 65) return 'high';
    if (percentage >= 35) return 'medium';
    return 'low';
  };

  const getProgressPercentage = (): number => {
    if (!storyData) return 0;
    const totalDecisions = storyData.scenes.filter(s => s.type === 'decision').length;
    return Math.round((decisionsHistory.length / totalDecisions) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>Failed to load story data.</p>
        </div>
      </div>
    );
  }

  // Intro Screen
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {storyData.title}
            </h1>
            <p className="text-gray-400 text-lg">{storyData.titleEnglish}</p>
          </div>

          {/* Description Card */}
          <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-6">
            <p className="text-gray-300 text-lg mb-4">{storyData.description}</p>
            <p className="text-gray-500 italic">{storyData.descriptionEnglish}</p>

            <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Level {storyData.level}
              </span>
              <span>•</span>
              <span>~{storyData.estimatedMinutes} min</span>
              <span>•</span>
              <span>{storyData.chapters.length} Kapitel</span>
            </div>
          </div>

          {/* Big 5 Explanation */}
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Die Big Five Persönlichkeitsmerkmale
            </h2>
            <div className="grid gap-3">
              {Object.entries(storyData.traitDescriptions).map(([key, trait]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${TRAIT_COLORS[key].bg} flex items-center justify-center text-white`}>
                    {TRAIT_ICONS[key]}
                  </div>
                  <div>
                    <span className="text-white font-medium">{trait.name}</span>
                    <span className="text-gray-500 ml-2">({trait.nameEnglish})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startStory}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Geschichte starten
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (phase === 'results') {
    const percentages = calculatePercentages();

    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Dein Persönlichkeitsprofil
            </h1>
            <p className="text-gray-400">Your Personality Profile</p>
          </div>

          {/* Trait Results */}
          <div className="space-y-4 mb-8">
            {Object.entries(percentages).map(([trait, percentage]) => {
              const traitInfo = storyData.traitDescriptions[trait];
              const level = getTraitLevel(percentage);
              const colors = TRAIT_COLORS[trait];

              return (
                <div key={trait} className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center text-white`}>
                        {TRAIT_ICONS[trait]}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{traitInfo.name}</h3>
                        <p className="text-gray-500 text-sm">{traitInfo.nameEnglish}</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{percentage}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {showTranslation ? traitInfo[level].english : traitInfo[level].german}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="w-full py-3 mb-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {showTranslation ? 'Auf Deutsch anzeigen' : 'Show in English'}
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={restartQuiz}
              className="flex-1 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Nochmal spielen
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Mein Persönlichkeitsprofil',
                    text: `Ich habe den Persönlichkeitstest gemacht! Meine Ergebnisse: Offenheit ${percentages.O}%, Gewissenhaftigkeit ${percentages.C}%, Extraversion ${percentages.E}%, Verträglichkeit ${percentages.A}%`,
                  });
                }
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Teilen
            </button>
          </div>

          {/* Vocabulary Section */}
          <div className="mt-8">
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="w-full py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              {showVocabulary ? 'Vokabeln ausblenden' : 'Vokabeln aus der Geschichte'}
            </button>

            {showVocabulary && (
              <div className="mt-4 bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-2">
                  {storyData.vocabulary.map((vocab, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-white">{vocab.german}</span>
                      <span className="text-gray-500">{vocab.english}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Story Screen
  const currentScene = getCurrentScene();
  const currentChapter = getCurrentChapter();

  if (!currentScene) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-red-400">Scene not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">
              {currentChapter && (
                <span>
                  Kapitel {currentChapter.id}: {currentChapter.title}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{getProgressPercentage()}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Scene Content */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-6">
          {/* German Text */}
          <p className="text-white text-lg leading-relaxed mb-4">
            {currentScene.german}
          </p>

          {/* English Translation Toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors mb-2"
          >
            {showTranslation ? 'Hide translation' : 'Show translation'}
          </button>

          {showTranslation && (
            <p className="text-gray-400 italic text-sm leading-relaxed">
              {currentScene.english}
            </p>
          )}
        </div>

        {/* Decision Choices or Continue Button */}
        {currentScene.type === 'decision' && currentScene.choices ? (
          <div className="space-y-3">
            {currentScene.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                disabled={animatingChoice !== null}
                className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                  animatingChoice === choice.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-[1.02]'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500/50'
                }`}
              >
                <p className="text-white mb-1">{choice.german}</p>
                {showTranslation && (
                  <p className="text-gray-500 text-sm italic">{choice.english}</p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Weiter
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Vocabulary Helper */}
        <button
          onClick={() => setShowVocabulary(!showVocabulary)}
          className="mt-6 w-full py-3 rounded-xl bg-gray-800/30 border border-gray-700/30 text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <BookOpen className="w-4 h-4" />
          {showVocabulary ? 'Vokabeln ausblenden' : 'Vokabelhilfe'}
        </button>

        {showVocabulary && (
          <div className="mt-3 bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {storyData.vocabulary.slice(0, 8).map((vocab, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span className="text-white">{vocab.german}</span>
                  <span className="text-gray-500">{vocab.english}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
