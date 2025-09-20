export default function OfflinePage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md">
        <div className="w-14 h-14 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">🔌</div>
        <h1 className="text-2xl font-bold mb-2">You’re Offline</h1>
        <p className="text-gray-400 mb-4">No internet connection detected. You can still review cached content and try again later.</p>
        <p className="text-sm text-gray-500">We’ll automatically sync when you’re back online.</p>
      </div>
    </main>
  )
}

