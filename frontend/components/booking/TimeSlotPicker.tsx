'use client';

interface TimeSlotPickerProps {
  date: Date;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

const TIME_SLOTS = {
  morning: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  afternoon: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  evening: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
};

export default function TimeSlotPicker({
  date,
  selectedTime,
  onSelectTime,
}: TimeSlotPickerProps) {
  // Mock availability - in real app, fetch from API
  const isSlotAvailable = (time: string) => {
    // Make some slots unavailable for demo
    const unavailable = ['09:30', '11:00', '14:00', '15:30', '19:00'];
    return !unavailable.includes(time);
  };

  const renderSlots = (slots: string[], label: string) => {
    const availableSlots = slots.filter(isSlotAvailable);

    if (availableSlots.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h4 className="text-sm font-medium text-gray-400 mb-3">{label}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {slots.map((time) => {
            const available = isSlotAvailable(time);
            const selected = selectedTime === time;

            return (
              <button
                key={time}
                onClick={() => available && onSelectTime(time)}
                disabled={!available}
                className={`
                  py-3 px-4 rounded-lg text-sm font-medium transition-all
                  ${!available ? 'bg-gray-800 text-gray-600 cursor-not-allowed line-through' : ''}
                  ${available && !selected ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700' : ''}
                  ${selected ? 'bg-blue-600 text-white ring-2 ring-blue-400' : ''}
                `}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      {/* Timezone Info */}
      <div className="mb-4 pb-4 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <span className="text-xs text-gray-500">
          Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </span>
      </div>

      {/* Time Slots */}
      <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
        {renderSlots(TIME_SLOTS.morning, 'Morning')}
        {renderSlots(TIME_SLOTS.afternoon, 'Afternoon')}
        {renderSlots(TIME_SLOTS.evening, 'Evening')}
      </div>

      {/* No Availability Message */}
      {Object.values(TIME_SLOTS)
        .flat()
        .every((slot) => !isSlotAvailable(slot)) && (
        <div className="text-center py-8 text-gray-500">
          No available time slots for this date.
        </div>
      )}
    </div>
  );
}
