'use client'

import { useState } from 'react'
import { login, signup } from '@/lib/api'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const submit = async () => {
    setError(null); setOk(null)
    try {
      const res = mode === 'login' ? await login(email, password) : await signup(email, password)
      localStorage.setItem('gb_token', res.access_token)
      setOk('Authenticated! You can go back and start studying.')
    } catch (e) {
      setError('Authentication failed')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">{mode === 'login' ? 'Log In' : 'Sign Up'}</h1>
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 rounded bg-gray-900 border border-gray-700"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded bg-gray-900 border border-gray-700"
          />
          <button
            onClick={submit}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold"
          >
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {mode === 'login' ? 'Create an account' : 'Have an account? Log in'}
          </button>
          {ok && <p className="text-green-400 text-sm">{ok}</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>
    </main>
  )
}

