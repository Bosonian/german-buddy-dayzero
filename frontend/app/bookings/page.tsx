'use client';

import { useState } from 'react';
import { Calendar, Video, MessageSquare, Clock, XCircle, RefreshCw, Star } from 'lucide-react';
import ReviewModal from '@/components/booking/ReviewModal';

type BookingStatus = 'upcoming' | 'past' | 'cancelled';

interface Booking {
  id: string;
  mentorName: string;
  mentorAvatar: string;
  sessionType: 'video' | 'voice' | 'chat';
  duration: number;
  date: string;
  time: string;
  price: number;
  status: BookingStatus;
  canJoin?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
  canReview?: boolean;
  rating?: number;
}

// Mock data
const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    mentorName: 'Anna Schmidt',
    mentorAvatar: 'AS',
    sessionType: 'video',
    duration: 60,
    date: '2025-12-15',
    time: '14:00',
    price: 45,
    status: 'upcoming',
    canJoin: true,
    canCancel: true,
    canReschedule: true,
  },
  {
    id: '2',
    mentorName: 'Thomas Müller',
    mentorAvatar: 'TM',
    sessionType: 'chat',
    duration: 30,
    date: '2025-12-18',
    time: '10:00',
    price: 22.5,
    status: 'upcoming',
    canCancel: true,
    canReschedule: true,
  },
  {
    id: '3',
    mentorName: 'Sophie Weber',
    mentorAvatar: 'SW',
    sessionType: 'video',
    duration: 60,
    date: '2025-12-10',
    time: '16:00',
    price: 50,
    status: 'past',
    canReview: true,
  },
  {
    id: '4',
    mentorName: 'Lukas Fischer',
    mentorAvatar: 'LF',
    sessionType: 'voice',
    duration: 30,
    date: '2025-12-08',
    time: '11:00',
    price: 20,
    status: 'past',
    rating: 5,
  },
  {
    id: '5',
    mentorName: 'Maria Becker',
    mentorAvatar: 'MB',
    sessionType: 'video',
    duration: 60,
    date: '2025-12-05',
    time: '15:00',
    price: 42,
    status: 'cancelled',
  },
];

const SESSION_ICONS = {
  video: Video,
  voice: MessageSquare,
  chat: MessageSquare,
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filteredBookings = MOCK_BOOKINGS.filter((b) => b.status === activeTab);

  const handleJoinSession = (bookingId: string) => {
    window.location.href = `/sessions/${bookingId}`;
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      // TODO: Call cancelBooking API
      console.log('Cancelling booking:', bookingId);
    }
  };

  const handleReschedule = (bookingId: string) => {
    // TODO: Implement reschedule flow
    alert('Reschedule feature coming soon!');
  };

  const handleLeaveReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-gray-400">Manage your mentoring sessions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {(['upcoming', 'past', 'cancelled'] as BookingStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
              <span className="ml-2 text-xs bg-gray-800 px-2 py-1 rounded-full">
                {MOCK_BOOKINGS.filter((b) => b.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No {activeTab} bookings
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming sessions. Find a mentor to get started!"
                : `You don't have any ${activeTab} sessions.`}
            </p>
            {activeTab === 'upcoming' && (
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                Find a Mentor
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const Icon = SESSION_ICONS[booking.sessionType];

              return (
                <div
                  key={booking.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Session Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {booking.mentorAvatar}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {booking.mentorName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Icon className="w-4 h-4" />
                            {booking.sessionType === 'video' && 'Video Call'}
                            {booking.sessionType === 'voice' && 'Voice Only'}
                            {booking.sessionType === 'chat' && 'Chat'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at {booking.time}
                          </span>
                        </div>
                        {booking.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < booking.rating!
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          €{booking.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 md:flex-shrink-0">
                      {booking.canJoin && (
                        <button
                          onClick={() => handleJoinSession(booking.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Join Now
                        </button>
                      )}
                      {booking.canReschedule && (
                        <button
                          onClick={() => handleReschedule(booking.id)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reschedule
                        </button>
                      )}
                      {booking.canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                      {booking.canReview && (
                        <button
                          onClick={() => handleLeaveReview(booking)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedBooking(null);
          }}
          mentorName={selectedBooking.mentorName}
          bookingId={selectedBooking.id}
        />
      )}
    </div>
  );
}
