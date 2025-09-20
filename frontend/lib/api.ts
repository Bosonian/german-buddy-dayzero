export interface LoginResponse {
  access_token: string
  token_type: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function signup(email: string, password: string, proficiencyLevel: string = 'A1'): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, proficiency_level: proficiencyLevel })
  })
  if (!res.ok) throw new Error('Signup failed')
  return res.json()
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const form = new URLSearchParams()
  form.set('username', email)
  form.set('password', password)
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function me(token: string) {
  const res = await fetch(`${BASE_URL}/me`, { headers: { ...authHeaders(token) } })
  if (!res.ok) throw new Error('Auth required')
  return res.json()
}

export interface SrsItem { id: number; german: string; english: string; level?: string; frequency?: number }

export async function postReview(itemId: number, rating: number, token: string) {
  const res = await fetch(`${BASE_URL}/pwa/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ item_id: itemId, rating })
  })
  if (!res.ok) throw new Error('Failed to post review')
  return res.json()
}

export async function getExercises(limit: number, token: string, level?: string): Promise<SrsItem[]> {
  const levelParam = level ? `&level=${encodeURIComponent(level)}` : ''
  const res = await fetch(`${BASE_URL}/pwa/exercises?limit=${limit}${levelParam}`, {
    headers: { ...authHeaders(token) }
  })
  if (!res.ok) throw new Error('Failed to fetch exercises')
  const data = await res.json()
  // Handle new API response format with daily_progress
  return data.exercises || data
}
