import VocabularyReview from '@/components/VocabularyReview'

export default function VocabularyReviewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-orange-100 to-red-100 bg-clip-text text-transparent">
            Vocabulary Review
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Practice words from completed stories with intelligent spaced repetition
          </p>
        </div>

        <VocabularyReview />
      </div>
    </main>
  )
}