"use client";

import type { EventInput } from "@fullcalendar/core";

interface CalendarEventContentProps {
  view: 'week' | 'day' | 'month';
  eventInfo: any;
}

export function CalendarEventContent({ view, eventInfo }: CalendarEventContentProps) {
  return (
    <div className={`p-1 ${view === 'month' ? 'text-[10px]' : 'text-xs'}`}>
      <div className="font-medium truncate">{eventInfo.event.title}</div>
      {view !== 'month' && (
        <div className="flex items-center justify-between opacity-80">
          <span>{eventInfo.event.extendedProps.category}</span>
          {eventInfo.event.extendedProps.sharedLabel && (
            <span className="ml-1 bg-black/20 rounded px-1 text-[10px]">{eventInfo.event.extendedProps.sharedLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}