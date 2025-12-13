// API client functions for video session operations

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Session {
  id: string;
  bookingId: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  actualDuration?: number; // actual time spent
  roomUrl?: string;
  recordingUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionToken {
  token: string;
  roomUrl: string;
  expiresAt: string;
}

export interface SessionSummary {
  sessionId: string;
  duration: number;
  startTime: string;
  endTime: string;
  participants: {
    mentorId: string;
    menteeId: string;
  };
  stats?: {
    messagesExchanged: number;
    avgResponseTime: number;
  };
}

/**
 * Get a session by ID
 */
export async function getSession(id: string, token?: string): Promise<Session> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }

    return await response.json();
  } catch (error) {
    console.error('Get session error:', error);
    throw error;
  }
}

/**
 * Start a session from a booking
 */
export async function startSession(bookingId: string, token?: string): Promise<Session> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to start session');
    }

    return await response.json();
  } catch (error) {
    console.error('Start session error:', error);
    throw error;
  }
}

/**
 * End an active session
 */
export async function endSession(
  id: string,
  notes?: string,
  token?: string
): Promise<SessionSummary> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to end session');
    }

    return await response.json();
  } catch (error) {
    console.error('End session error:', error);
    throw error;
  }
}

/**
 * Get a session access token for video/audio
 * This token is used to authenticate with the video service (e.g., Daily.co, Twilio)
 */
export async function getSessionToken(id: string, token?: string): Promise<SessionToken> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to get session token');
    }

    return await response.json();
  } catch (error) {
    console.error('Get session token error:', error);
    throw error;
  }
}

/**
 * Get session recording URL (if available)
 */
export async function getSessionRecording(
  id: string,
  token?: string
): Promise<{ recordingUrl: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}/recording`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session recording');
    }

    return await response.json();
  } catch (error) {
    console.error('Get session recording error:', error);
    throw error;
  }
}

/**
 * Send a message during a session
 */
export async function sendSessionMessage(
  sessionId: string,
  message: string,
  token?: string
): Promise<{ id: string; message: string; timestamp: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
}

/**
 * Get session messages
 */
export async function getSessionMessages(
  sessionId: string,
  token?: string
): Promise<Array<{ id: string; sender: string; message: string; timestamp: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return await response.json();
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
}

/**
 * Update session notes
 */
export async function updateSessionNotes(
  id: string,
  notes: string,
  token?: string
): Promise<Session> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update session notes');
    }

    return await response.json();
  } catch (error) {
    console.error('Update session notes error:', error);
    throw error;
  }
}
