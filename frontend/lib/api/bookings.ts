// API client functions for booking operations

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface CreateBookingData {
  mentorId: string;
  sessionType: 'video' | 'voice' | 'chat';
  duration: number;
  date: string;
  time: string;
  notes?: string;
}

export interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  sessionType: 'video' | 'voice' | 'chat';
  duration: number;
  date: string;
  time: string;
  price: number;
  status: 'upcoming' | 'past' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilters {
  status?: 'upcoming' | 'past' | 'cancelled' | 'completed';
  mentorId?: string;
  menteeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingData, token?: string): Promise<Booking> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Create booking error:', error);
    throw error;
  }
}

/**
 * Get bookings with optional filters
 */
export async function getBookings(
  filters?: BookingFilters,
  token?: string
): Promise<Booking[]> {
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const url = `${API_BASE_URL}/bookings${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    return await response.json();
  } catch (error) {
    console.error('Get bookings error:', error);
    throw error;
  }
}

/**
 * Get a single booking by ID
 */
export async function getBooking(id: string, token?: string): Promise<Booking> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Get booking error:', error);
    throw error;
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  id: string,
  reason?: string,
  token?: string
): Promise<Booking> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to cancel booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Cancel booking error:', error);
    throw error;
  }
}

/**
 * Reschedule a booking
 */
export async function rescheduleBooking(
  id: string,
  newDate: string,
  newTime: string,
  token?: string
): Promise<Booking> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ date: newDate, time: newTime }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to reschedule booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Reschedule booking error:', error);
    throw error;
  }
}

/**
 * Get available time slots for a mentor on a specific date
 */
export async function getAvailableSlots(
  mentorId: string,
  date: string,
  duration: number,
  token?: string
): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/bookings/availability?mentorId=${mentorId}&date=${date}&duration=${duration}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch available slots');
    }

    return await response.json();
  } catch (error) {
    console.error('Get available slots error:', error);
    throw error;
  }
}
