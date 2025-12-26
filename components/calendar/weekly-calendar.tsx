"use client";

import { addDays, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addHours } from "date-fns";
import { useMemo, useState, memo } from "react";
import { usePlanner } from "@/lib/store";
import { isoDate } from "@/lib/utils";
import type { BlockItem } from "@/types/scheduler";
import dynamic from "next/dynamic";
import type { EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import { toast } from "sonner";
import { EditItemDialog } from "@/components/edit-item-dialog";
import { CalendarEventContent } from "@/components/calendar/calendar-event-content";
import { CalendarQuickAdd } from "@/components/calendar/calendar-quick-add";
import { useCalendarEventHandlers } from "@/components/calendar/calendar-event-handlers";

export const WeeklyCalendar = memo(function WeeklyCalendar({ view = 'week', draggedItem }: { view?: 'week' | 'day' | 'month'; draggedItem?: { id: string; kind: string } | null }) {
  const weekStart = usePlanner(s => s.weekStart);
  const getItemsForDay = usePlanner(s => s.getItemsForDay);
  const addTask = usePlanner(s => s.addTask);
  const goToWeek = usePlanner(s => s.goToWeek);
  const scheduleTask = usePlanner(s => s.scheduleTask);
  const moveEvent = usePlanner(s => s.moveEvent);
  const updateItem = usePlanner(s => s.updateItem);
  const conflictsAt = usePlanner(s => s.conflictsAt);
  const [quickAdd, setQuickAdd] = useState<{ start: Date; end: Date } | null>(null);
  const [title, setTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const draggedItemState = draggedItem || null;

  // Initialize calendar event handlers using the custom hook
  const calendarHandlers = useCalendarEventHandlers({
    view,
    draggedItem: draggedItemState,
    weekStart,
    goToWeek,
    updateItem,
    conflictsAt,
    scheduleTask,
    moveEvent,
    setEditingItemId,
  });

  const days = useMemo(() => {
    if (view === 'day') {
      return [parseISO(weekStart)];
    }
    if (view === 'month') {
      const monthStart = startOfMonth(parseISO(weekStart));
      const monthEnd = endOfMonth(parseISO(weekStart));
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
    return Array.from({ length: 5 }, (_, i) => addDays(parseISO(weekStart), i));
  }, [weekStart, view]);

  const events: EventInput[] = useMemo(() => {
    const allItems: BlockItem[] = [];
    days.forEach(day => {
      allItems.push(...getItemsForDay(day));
    });
    return allItems.map(item => {
      const start = item.type === "event" ? item.start : item.scheduledStart;
      const end = item.type === "event" ? item.end : item.scheduledEnd;
      if (!start || !end) return null;
      return {
        id: item.id,
        title: item.title,
        start,
        end,
        backgroundColor: item.color,
        textColor: "#ffffff",
        extendedProps: {
          category: item.category,
          type: item.type,
          sharedLabel: item.type === "event" ? item.sharedLabel : undefined,
        },
      };
    }).filter(Boolean) as EventInput[];
  }, [days, getItemsForDay]);

  // Handle select for quick add
  function handleSelect(selectInfo: any) {
    setQuickAdd({ start: selectInfo.start, end: selectInfo.end });
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={view === 'day' ? 'timeGridDay' : view === 'month' ? 'dayGridMonth' : 'timeGridWeek'}
        weekends={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        height="100%"
        events={events}
        selectable={view !== 'month'}
        select={view !== 'month' ? handleSelect : undefined}
        datesSet={calendarHandlers.handleDatesSet}
        initialDate={parseISO(weekStart)}
        headerToolbar={false}
        dayHeaderFormat={view === 'day' ? { weekday: 'long', day: 'numeric', month: 'short' } : view === 'month' ? { weekday: 'short' } : { weekday: 'short', day: 'numeric' }}
        slotDuration={view === 'month' ? undefined : "01:00:00"}
        slotLabelFormat={view === 'month' ? undefined : { hour: 'numeric', meridiem: false }}
        droppable={true}
        drop={calendarHandlers.handleExternalDrop}
        eventReceive={calendarHandlers.handleExternalDrop}
        editable={view !== 'month'}
        eventResize={view !== 'month' ? calendarHandlers.handleEventResize : undefined}
        eventDrop={view !== 'month' ? calendarHandlers.handleEventDrop : undefined}
        eventClick={calendarHandlers.handleEventClick}
        eventContent={(eventInfo) => <CalendarEventContent view={view} eventInfo={eventInfo} />}
      />

      <CalendarQuickAdd
        quickAdd={quickAdd}
        setQuickAdd={setQuickAdd}
        addTask={addTask}
        title={title}
        setTitle={setTitle}
      />

      <EditItemDialog itemId={editingItemId} onClose={() => setEditingItemId(null)} />
    </div>
  );
});

