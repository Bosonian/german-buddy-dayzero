import { useState, useEffect } from 'react'
import {
  getMentors,
  getMentor,
  getMentorAvailability,
  getMentorReviews,
  getSimilarMentors,
  getCategories,
  isMentorSaved,
  type Mentor,
  type MentorFilters,
  type Review,
  type Category,
} from '@/lib/api/mentors'

interface UseMentorsResult {
  mentors: Mentor[]
  loading: boolean
  error: string | null
  total: number
  refetch: () => void
}

export function useMentors(filters: MentorFilters = {}): UseMentorsResult {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchMentors = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getMentors(filters)
      setMentors(result.mentors)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mentors')
      setMentors([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMentors()
  }, [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.languages?.join(','),
    filters.availableNow,
    filters.availableThisWeek,
    filters.minRating,
    filters.search,
    filters.page,
    filters.limit,
  ])

  return { mentors, loading, error, total, refetch: fetchMentors }
}

interface UseMentorResult {
  mentor: Mentor | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMentor(id: string | null): UseMentorResult {
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMentor = async () => {
    if (!id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await getMentor(id)
      setMentor(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mentor')
      setMentor(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMentor()
  }, [id])

  return { mentor, loading, error, refetch: fetchMentor }
}

interface UseMentorAvailabilityResult {
  slots: string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMentorAvailability(id: string | null): UseMentorAvailabilityResult {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = async () => {
    if (!id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await getMentorAvailability(id)
      setSlots(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability')
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
  }, [id])

  return { slots, loading, error, refetch: fetchAvailability }
}

interface UseMentorReviewsResult {
  reviews: Review[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMentorReviews(mentorId: string | null): UseMentorReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    if (!mentorId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await getMentorReviews(mentorId)
      setReviews(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [mentorId])

  return { reviews, loading, error, refetch: fetchReviews }
}

interface UseSimilarMentorsResult {
  mentors: Mentor[]
  loading: boolean
  error: string | null
}

export function useSimilarMentors(mentorId: string | null): UseSimilarMentorsResult {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mentorId) {
      setLoading(false)
      return
    }

    const fetchSimilar = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getSimilarMentors(mentorId)
        setMentors(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch similar mentors')
        setMentors([])
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [mentorId])

  return { mentors, loading, error }
}

interface UseCategoriesResult {
  categories: Category[]
  loading: boolean
  error: string | null
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getCategories()
        setCategories(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

interface UseSavedMentorResult {
  isSaved: boolean
  loading: boolean
}

export function useSavedMentor(id: string | null): UseSavedMentorResult {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSaved = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const saved = await isMentorSaved(id)
        setIsSaved(saved)
      } catch {
        setIsSaved(false)
      } finally {
        setLoading(false)
      }
    }

    checkSaved()
  }, [id])

  return { isSaved, loading }
}
