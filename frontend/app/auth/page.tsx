'use client'

import { useState } from 'react'
import { login, signup } from '@/lib/api'
import Einstufungstest from '@/components/Einstufungstest'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [showTest, setShowTest] = useState(false)
  const [proficiencyLevel, setProficiencyLevel] = useState<string | null>(null)

  const submit = async () => {
    setError(null); setOk(null)
    try {
      if (mode === 'login') {
        const res = await login(email, password)
        localStorage.setItem('gb_token', res.access_token)
        setOk('Logged in successfully! Redirecting...')
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } else {
        // For signup, show proficiency test first
        setShowTest(true)
      }
    } catch (e) {
      setError('Authentication failed')
    }
  }

  const handleTestComplete = async (level: string, score: number) => {
    setProficiencyLevel(level)
    try {
      // Sign up with the determined proficiency level
      const res = await signup(email, password, level)
      localStorage.setItem('gb_token', res.access_token)
      localStorage.setItem('gb_proficiency_level', level)
      console.log(`✅ User level set to: ${level}`) // Debug log
      setOk(`Account created! Your level: ${level}. You'll now get ${level}-appropriate sentences. Redirecting...`)
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (e) {
      setError('Account creation failed')
      setShowTest(false)
    }
  }

  if (showTest) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Welcome to German Buddy!</h1>
            <p className="text-gray-400">
              Let's determine your German proficiency level to personalize your learning experience.
            </p>
          </div>
          <Einstufungstest onComplete={handleTestComplete} />
          {error && (
            <div className="mt-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setShowTest(false)}
                className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Back to signup
              </button>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">{mode === 'login' ? 'Log In' : 'Sign Up'}</h1>
        {mode === 'signup' && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-200">
              📊 After signup, you'll take a quick proficiency test to determine your German level!
            </p>
          </div>
        )}
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
            disabled={!email || !password}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-semibold"
          >
            {mode === 'login' ? 'Log In' : 'Sign Up & Take Test'}
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

