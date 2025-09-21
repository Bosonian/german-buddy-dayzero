import Dictionary from '@/components/Dictionary'

export default function DictionaryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex items-center space-x-6 text-sm mb-8">
          <a href="/" className="text-gray-400 hover:text-white transition-colors">
            🏠 Practice
          </a>
          <a href="/reading" className="text-gray-400 hover:text-white transition-colors">
            📖 Stories
          </a>
          <a href="/dictionary" className="text-blue-400 hover:text-blue-300 transition-colors">
            📚 Dictionary
          </a>
          <a href="/vocabulary-review" className="text-gray-400 hover:text-white transition-colors">
            🧠 Vocabulary Review
          </a>
        </nav>

        <Dictionary />
      </div>
    </main>
  )
}