'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  Clock,
  MessageSquare,
  Settings,
  Video,
  Users,
} from 'lucide-react';

interface Earning {
  period: string;
  amount: number;
}

interface Session {
  id: string;
  menteeName: string;
  menteeAvatar: string;
  date: string;
  time: string;
  duration: number;
  type: 'video' | 'voice' | 'chat';
  earnings: number;
}

interface Review {
  id: string;
  menteeName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Payout {
  id: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
}

// Mock data
const EARNINGS: Earning[] = [
  { period: 'Today', amount: 125.5 },
  { period: 'This Week', amount: 487.25 },
  { period: 'This Month', amount: 1842.0 },
  { period: 'Total', amount: 8456.75 },
];

const UPCOMING_SESSIONS: Session[] = [
  {
    id: '1',
    menteeName: 'Max Weber',
    menteeAvatar: 'MW',
    date: '2025-12-14',
    time: '14:00',
    duration: 60,
    type: 'video',
    earnings: 45,
  },
  {
    id: '2',
    menteeName: 'Lisa Hoffmann',
    menteeAvatar: 'LH',
    date: '2025-12-14',
    time: '16:00',
    duration: 30,
    type: 'chat',
    earnings: 22.5,
  },
  {
    id: '3',
    menteeName: 'Jonas Bauer',
    menteeAvatar: 'JB',
    date: '2025-12-15',
    time: '10:00',
    duration: 60,
    type: 'video',
    earnings: 45,
  },
];

const RECENT_REVIEWS: Review[] = [
  {
    id: '1',
    menteeName: 'Emma Schneider',
    rating: 5,
    comment: 'Excellent session! Very helpful and patient. Learned a lot about German grammar.',
    date: '2025-12-12',
  },
  {
    id: '2',
    menteeName: 'Oliver Klein',
    rating: 5,
    comment: 'Great mentor, explained complex topics in a simple way.',
    date: '2025-12-11',
  },
  {
    id: '3',
    menteeName: 'Sophia Wagner',
    rating: 4,
    comment: 'Good session, would recommend!',
    date: '2025-12-10',
  },
];

const PAYOUT_HISTORY: Payout[] = [
  { id: '1', amount: 450.0, date: '2025-12-01', status: 'completed' },
  { id: '2', amount: 380.5, date: '2025-11-01', status: 'completed' },
  { id: '3', amount: 520.25, date: '2025-10-01', status: 'completed' },
];

const STATS = {
  sessionsCompleted: 127,
  averageRating: 4.9,
  responseRate: 98,
  repeatClients: 45,
};

export default function MentorDashboardPage() {
  const [activePayoutTab, setActivePayoutTab] = useState<'pending' | 'history'>('history');

  const SESSION_ICONS = {
    video: Video,
    voice: MessageSquare,
    chat: MessageSquare,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Mentor Dashboard</h1>
            <p className="text-gray-400">Track your earnings and manage sessions</p>
          </div>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit">
            <Settings className="w-5 h-5" />
            Set Availability
          </button>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {EARNINGS.map((earning, index) => (
            <div
              key={earning.period}
              className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${
                index === 3 ? 'lg:col-span-1 md:col-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">{earning.period}</p>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">€{earning.amount.toFixed(2)}</p>
              {index < 3 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% from last period</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{STATS.sessionsCompleted}</p>
                <p className="text-xs text-gray-400">Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{STATS.averageRating}</p>
                <p className="text-xs text-gray-400">Avg Rating</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{STATS.responseRate}%</p>
                <p className="text-xs text-gray-400">Response Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{STATS.repeatClients}</p>
                <p className="text-xs text-gray-400">Repeat Clients</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Upcoming Sessions</h2>
            </div>
            <div className="p-6 space-y-4">
              {UPCOMING_SESSIONS.map((session) => {
                const Icon = SESSION_ICONS[session.type];
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {session.menteeAvatar}
                      </div>
                      <div>
                        <p className="font-medium text-white">{session.menteeName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <Icon className="w-3 h-3" />
                          <span>
                            {new Date(session.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at {session.time}
                          </span>
                          <span>•</span>
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">€{session.earnings}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Recent Reviews</h2>
            </div>
            <div className="p-6 space-y-4">
              {RECENT_REVIEWS.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-white">{review.menteeName}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{review.comment}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Payouts</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActivePayoutTab('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activePayoutTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActivePayoutTab('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activePayoutTab === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
          <div className="p-6">
            {activePayoutTab === 'history' ? (
              <div className="space-y-3">
                {PAYOUT_HISTORY.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700"
                  >
                    <div>
                      <p className="font-medium text-white">
                        €{payout.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(payout.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p>No pending payouts</p>
                <p className="text-sm mt-1">Payouts are processed on the 1st of each month</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
