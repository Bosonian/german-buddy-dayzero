import VocabularyReview from '@/components/VocabularyReview'

export default function VocabularyReviewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex items-center space-x-6 text-sm mb-8">
          <a href="/" className="text-gray-400 hover:text-white transition-colors">
            🏠 Practice
          </a>
          <a href="/reading" className="text-gray-400 hover:text-white transition-colors">
            📖 Stories
          </a>
          <a href="/dictionary" className="text-gray-400 hover:text-white transition-colors">
            📚 Dictionary
          </a>
          <a href="/vocabulary-review" className="text-purple-400 hover:text-purple-300 transition-colors">
            🧠 Vocabulary Review
          </a>
        </nav>

        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Vocabulary Review</h1>
            <p className="text-gray-400">
              Practice words from completed stories with spaced repetition
            </p>
          </header>

          <VocabularyReview />
        </div>
      </div>
    </main>
  )
}