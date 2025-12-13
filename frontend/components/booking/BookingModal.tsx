'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import TimeSlotPicker from './TimeSlotPicker';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorName: string;
  mentorId: string;
  hourlyRate: number;
}

type SessionType = 'video' | 'voice' | 'chat';
type Duration = 15 | 30 | 60;

const SESSION_TYPE_LABELS = {
  video: 'Video Call',
  voice: 'Voice Only',
  chat: 'Chat Session',
};

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
] as const;

export default function BookingModal({
  isOpen,
  onClose,
  mentorName,
  mentorId,
  hourlyRate,
}: BookingModalProps) {
  const [sessionType, setSessionType] = useState<SessionType>('video');
  const [duration, setDuration] = useState<Duration>(30);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const calculatePrice = () => {
    return (hourlyRate * duration) / 60;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // TODO: Call createBooking API
      console.log('Booking:', {
        mentorId,
        sessionType,
        duration,
        date: selectedDate,
        time: selectedTime,
        notes,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert('Booking confirmed! Redirecting to payment...');
      onClose();
    } catch (error) {
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = selectedDate && selectedTime && sessionType && duration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Book a Session</h2>
            <p className="text-gray-400 text-sm mt-1">with {mentorName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Session Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSessionType(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    sessionType === type
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{SESSION_TYPE_LABELS[type]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value as Duration)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    duration === d.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{d.label}</div>
                  <div className="text-xs mt-1">
                    €{((hourlyRate * d.value) / 60).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Date
            </label>
            <CalendarPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Time
              </label>
              <TimeSlotPicker
                date={selectedDate}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Notes for Mentor (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Let your mentor know what you'd like to focus on..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Price Summary */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Session ({duration} min)</span>
              <span className="text-white">€{calculatePrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Platform fee (10%)</span>
              <span className="text-white">€{(calculatePrice() * 0.1).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-blue-400">
                  €{(calculatePrice() * 1.1).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6">
          <button
            onClick={handleConfirm}
            disabled={!isFormValid || isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Confirm & Pay'}
          </button>
        </div>
      </div>
    </div>
  );
}
