'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faClock, faTimes } from '@fortawesome/free-solid-svg-icons';

interface SchedulePickerProps {
  scheduledDate: string;
  scheduledTime: string;
  onChange: (date: string, time: string) => void;
  onClear: () => void;
}

export default function SchedulePicker({
  scheduledDate,
  scheduledTime,
  onChange,
  onClear,
}: SchedulePickerProps) {
  const hasSchedule = scheduledDate && scheduledTime;

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-blue-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendar} className="text-blue-600" />
          定时发布
        </h4>
        {hasSchedule && (
          <button
            type="button"
            onClick={onClear}
            className="text-blue-500 hover:text-blue-700"
            title="清除定时"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-blue-700 mb-1">
            发布日期
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faCalendar}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            />
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => onChange(e.target.value, scheduledTime)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-9 pr-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-700 mb-1">
            发布时间
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faClock}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => onChange(scheduledDate, e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      {hasSchedule && (
        <p className="text-xs text-blue-600 mt-2">
          将于 {scheduledDate} {scheduledTime} 自动发布
        </p>
      )}
    </div>
  );
}
