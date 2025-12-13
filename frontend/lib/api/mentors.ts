// API client for mentor-related endpoints

export interface Mentor {
  id: string
  name: string
  headline: string
  avatar: string
  rating: number
  sessionCount: number
  pricePerSession: number
  category: string
  languages: string[]
  availableToday: boolean
  expertise: string[]
  about: string
  nextAvailableSlots: string[]
  totalReviews: number
  isPremium: boolean
}

export interface Review {
  id: string
  mentorId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  createdAt: string
}

export interface MentorFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  languages?: string[]
  availableNow?: boolean
  availableThisWeek?: boolean
  minRating?: number
  search?: string
  page?: number
  limit?: number
}

export interface Category {
  id: string
  name: string
  icon: string
  count: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Mock data for initial development
const MOCK_MENTORS: Mentor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Weber',
    headline: 'Senior Medical Resident | Internal Medicine',
    avatar: 'https://i.pravatar.cc/150?img=1',
    rating: 4.9,
    sessionCount: 247,
    pricePerSession: 45,
    category: 'Medicine',
    languages: ['German', 'English'],
    availableToday: true,
    expertise: ['Medical German', 'Clinical Rotations', 'FSP Exam', 'Approbation'],
    about: 'I help international doctors navigate the German healthcare system and prepare for their Approbation. With 5+ years of experience mentoring medical professionals, I understand the challenges you face.',
    nextAvailableSlots: ['2025-12-14T10:00:00Z', '2025-12-14T14:00:00Z', '2025-12-15T09:00:00Z', '2025-12-16T11:00:00Z', '2025-12-17T15:00:00Z'],
    totalReviews: 189,
    isPremium: true,
  },
  {
    id: '2',
    name: 'Michael Schneider',
    headline: 'Senior Software Engineer at SAP',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rating: 4.8,
    sessionCount: 312,
    pricePerSession: 35,
    category: 'Engineering',
    languages: ['German', 'English', 'Turkish'],
    availableToday: false,
    expertise: ['Job Search', 'Technical Interviews', 'CV Review', 'Visa Process'],
    about: 'Former international student turned senior engineer. I help developers land their dream jobs in Germany and navigate the tech industry here.',
    nextAvailableSlots: ['2025-12-15T16:00:00Z', '2025-12-16T10:00:00Z', '2025-12-17T14:00:00Z', '2025-12-18T09:00:00Z', '2025-12-19T11:00:00Z'],
    totalReviews: 267,
    isPremium: false,
  },
  {
    id: '3',
    name: 'Anna Müller',
    headline: 'Registered Nurse | University Hospital Munich',
    avatar: 'https://i.pravatar.cc/150?img=5',
    rating: 4.95,
    sessionCount: 156,
    pricePerSession: 40,
    category: 'Nursing',
    languages: ['German', 'English', 'Spanish'],
    availableToday: true,
    expertise: ['Nursing License', 'German Healthcare', 'Medical Terminology', 'Integration'],
    about: 'I mentor international nurses through their license recognition process and help them integrate into the German healthcare system.',
    nextAvailableSlots: ['2025-12-14T13:00:00Z', '2025-12-15T10:00:00Z', '2025-12-16T14:00:00Z', '2025-12-17T09:00:00Z', '2025-12-18T16:00:00Z'],
    totalReviews: 142,
    isPremium: true,
  },
  {
    id: '4',
    name: 'Thomas Fischer',
    headline: 'Immigration Consultant & Life Coach',
    avatar: 'https://i.pravatar.cc/150?img=13',
    rating: 4.7,
    sessionCount: 423,
    pricePerSession: 30,
    category: 'Life in Germany',
    languages: ['German', 'English', 'French'],
    availableToday: true,
    expertise: ['Visa & Permits', 'Finding Apartments', 'Banking', 'Cultural Integration'],
    about: 'With 10+ years helping expats settle in Germany, I provide practical guidance on everything from bureaucracy to making friends.',
    nextAvailableSlots: ['2025-12-14T11:00:00Z', '2025-12-14T15:00:00Z', '2025-12-15T13:00:00Z', '2025-12-16T10:00:00Z', '2025-12-17T14:00:00Z'],
    totalReviews: 381,
    isPremium: false,
  },
  {
    id: '5',
    name: 'Dr. Elena Popov',
    headline: 'Cardiologist | Premium Mentor',
    avatar: 'https://i.pravatar.cc/150?img=9',
    rating: 5.0,
    sessionCount: 89,
    pricePerSession: 75,
    category: 'Premium',
    languages: ['German', 'English', 'Russian'],
    availableToday: false,
    expertise: ['Specialist Training', 'Research', 'Career Planning', 'Work-Life Balance'],
    about: 'Premium mentorship for medical professionals seeking specialist training. I offer personalized career coaching and research guidance.',
    nextAvailableSlots: ['2025-12-16T14:00:00Z', '2025-12-18T10:00:00Z', '2025-12-20T11:00:00Z', '2025-12-22T15:00:00Z', '2025-12-23T09:00:00Z'],
    totalReviews: 89,
    isPremium: true,
  },
  {
    id: '6',
    name: 'Lisa Wagner',
    headline: 'Data Scientist at Siemens',
    avatar: 'https://i.pravatar.cc/150?img=16',
    rating: 4.85,
    sessionCount: 198,
    pricePerSession: 38,
    category: 'Engineering',
    languages: ['German', 'English'],
    availableToday: true,
    expertise: ['Data Science', 'Python', 'Career Switch', 'Networking'],
    about: 'Helping professionals transition into data science roles in Germany. I share insights on the industry and job market.',
    nextAvailableSlots: ['2025-12-14T16:00:00Z', '2025-12-15T11:00:00Z', '2025-12-16T15:00:00Z', '2025-12-17T10:00:00Z', '2025-12-18T14:00:00Z'],
    totalReviews: 176,
    isPremium: false,
  },
]

const MOCK_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Mentors', icon: '🎯', count: 523 },
  { id: 'engineering', name: 'Engineering', icon: '💻', count: 142 },
  { id: 'medicine', name: 'Medicine', icon: '⚕️', count: 87 },
  { id: 'nursing', name: 'Nursing', icon: '👨‍⚕️', count: 64 },
  { id: 'life', name: 'Life in Germany', icon: '🇩🇪', count: 156 },
  { id: 'premium', name: 'Premium', icon: '⭐', count: 74 },
]

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    mentorId: '1',
    userName: 'Ahmed K.',
    userAvatar: 'https://i.pravatar.cc/150?img=33',
    rating: 5,
    comment: 'Dr. Weber helped me prepare for my FSP exam perfectly. Passed on first attempt! Highly recommend.',
    createdAt: '2025-11-28T10:00:00Z',
  },
  {
    id: '2',
    mentorId: '1',
    userName: 'Maria S.',
    userAvatar: 'https://i.pravatar.cc/150?img=26',
    rating: 5,
    comment: 'Very professional and knowledgeable. She understands the struggles of international doctors.',
    createdAt: '2025-11-15T14:00:00Z',
  },
  {
    id: '3',
    mentorId: '1',
    userName: 'Raj P.',
    userAvatar: 'https://i.pravatar.cc/150?img=68',
    rating: 4,
    comment: 'Great mentor, helped me a lot with medical German vocabulary.',
    createdAt: '2025-10-22T09:00:00Z',
  },
]

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function getMentors(filters: MentorFilters = {}): Promise<{ mentors: Mentor[]; total: number }> {
  await delay(500) // Simulate API delay

  let filtered = [...MOCK_MENTORS]

  // Apply filters
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(m => m.category.toLowerCase() === filters.category?.toLowerCase())
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter(m => m.pricePerSession >= filters.minPrice!)
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter(m => m.pricePerSession <= filters.maxPrice!)
  }

  if (filters.languages && filters.languages.length > 0) {
    filtered = filtered.filter(m =>
      filters.languages!.some(lang => m.languages.includes(lang))
    )
  }

  if (filters.availableNow || filters.availableToday) {
    filtered = filtered.filter(m => m.availableToday)
  }

  if (filters.minRating !== undefined) {
    filtered = filtered.filter(m => m.rating >= filters.minRating!)
  }

  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(search) ||
      m.headline.toLowerCase().includes(search) ||
      m.expertise.some(e => e.toLowerCase().includes(search))
    )
  }

  // Pagination
  const page = filters.page || 1
  const limit = filters.limit || 12
  const start = (page - 1) * limit
  const end = start + limit

  return {
    mentors: filtered.slice(start, end),
    total: filtered.length,
  }
}

export async function getMentor(id: string): Promise<Mentor | null> {
  await delay(300)

  const mentor = MOCK_MENTORS.find(m => m.id === id)
  return mentor || null
}

export async function getMentorAvailability(id: string): Promise<string[]> {
  await delay(200)

  const mentor = MOCK_MENTORS.find(m => m.id === id)
  return mentor?.nextAvailableSlots || []
}

export async function getMentorReviews(mentorId: string): Promise<Review[]> {
  await delay(300)

  return MOCK_REVIEWS.filter(r => r.mentorId === mentorId)
}

export async function getSimilarMentors(mentorId: string): Promise<Mentor[]> {
  await delay(400)

  const mentor = MOCK_MENTORS.find(m => m.id === mentorId)
  if (!mentor) return []

  // Return mentors in same category
  return MOCK_MENTORS
    .filter(m => m.id !== mentorId && m.category === mentor.category)
    .slice(0, 3)
}

export async function likeMentor(id: string): Promise<boolean> {
  await delay(200)

  // TODO: Implement actual API call when backend is ready
  // const response = await fetch(`${API_URL}/mentors/${id}/like`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${token}`,
  //   },
  // })
  // return response.ok

  return true
}

export async function saveMentor(id: string): Promise<boolean> {
  await delay(200)

  // Store in localStorage for now
  if (typeof window !== 'undefined') {
    const saved = JSON.parse(localStorage.getItem('gb_saved_mentors') || '[]')
    if (!saved.includes(id)) {
      saved.push(id)
      localStorage.setItem('gb_saved_mentors', JSON.stringify(saved))
    }
  }

  return true
}

export async function unsaveMentor(id: string): Promise<boolean> {
  await delay(200)

  // Remove from localStorage
  if (typeof window !== 'undefined') {
    const saved = JSON.parse(localStorage.getItem('gb_saved_mentors') || '[]')
    const updated = saved.filter((savedId: string) => savedId !== id)
    localStorage.setItem('gb_saved_mentors', JSON.stringify(updated))
  }

  return true
}

export async function getCategories(): Promise<Category[]> {
  await delay(200)
  return MOCK_CATEGORIES
}

export async function isMentorSaved(id: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const saved = JSON.parse(localStorage.getItem('gb_saved_mentors') || '[]')
    return saved.includes(id)
  }
  return false
}
