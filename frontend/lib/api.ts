export interface LoginResponse {
  access_token: string
  token_type: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function signup(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
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

export async function getDue(level: string, limit: number, token: string): Promise<SrsItem[]> {
  const res = await fetch(`${BASE_URL}/srs/due?level=${encodeURIComponent(level)}&limit=${limit}`, {
    headers: { ...authHeaders(token) }
  })
  if (!res.ok) throw new Error('Failed to fetch due items')
  return res.json()
}

export async function postReview(itemId: number, rating: number, responseMs: number, token: string) {
  const res = await fetch(`${BASE_URL}/srs/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ item_id: itemId, rating, response_ms: responseMs })
  })
  if (!res.ok) throw new Error('Failed to post review')
  return res.json()
}

