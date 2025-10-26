"use client";

import { addDays, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addHours } from "date-fns";
import { useMemo, useState, memo } from "react";
import { usePlanner } from "@/lib/store";
import { isoDate } from "@/lib/utils";
import type { BlockItem } from "@/types/scheduler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import type { EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import { toast } from "sonner";
import { EditItemDialog } from "@/components/edit-item-dialog";

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

  function handleSelect(selectInfo: any) {
    setQuickAdd({ start: selectInfo.start, end: selectInfo.end });
  }

  function handleQuickAdd() {
    if (!quickAdd || !title.trim()) return;
    addTask({
      title: title.trim(),
      category: "Inbox",
      scheduledStart: isoDate(quickAdd.start),
      scheduledEnd: isoDate(quickAdd.end)
    });
    setTitle("");
    setQuickAdd(null);
  }

  function handleDatesSet(dateInfo: any) {
    const newWeekStart = format(dateInfo.start, "yyyy-MM-dd");
    if (newWeekStart !== weekStart) {
      if (view === 'day') {
        // For day view, navigate by day instead of week
        const offset = Math.round((new Date(newWeekStart).getTime() - new Date(weekStart).getTime()) / (24 * 60 * 60 * 1000));
        goToWeek(offset);
      } else if (view === 'month') {
        // For month view, set weekStart to the start of the displayed month
        const monthStart = startOfMonth(dateInfo.start);
        const newWeekStartISO = format(monthStart, "yyyy-MM-dd");
        if (newWeekStartISO !== weekStart) {
          const offset = Math.round((new Date(newWeekStartISO).getTime() - new Date(weekStart).getTime()) / (7 * 24 * 60 * 60 * 1000));
          goToWeek(offset);
        }
      } else {
        const offset = Math.round((new Date(newWeekStart).getTime() - new Date(weekStart).getTime()) / (7 * 24 * 60 * 60 * 1000));
        goToWeek(offset);
      }
    }
  }

  function handleExternalDrop(dropInfo: any) {
    if (!draggedItemState) return;
    const { id, kind } = draggedItemState;
    const start = dropInfo.date;
    const end = addHours(start, 1); // Default 1-hour duration
    const startISO = isoDate(start);
    const endISO = isoDate(end);
    try {
      if (kind === "task") {
        scheduleTask(id, startISO, endISO);
        toast.success("Task scheduled");
      } else if (kind === "event") {
        moveEvent(id, startISO, endISO);
        toast.success("Event moved");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Unable to schedule due to conflict");
    }
  }

  function handleExternalDragStart(dragInfo: any) {
    // This will be set from the parent DndContext
  }

  function handleEventResize(resizeInfo: any) {
    const eventId = resizeInfo.event.id;
    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;
    const startISO = isoDate(newStart);
    const endISO = isoDate(newEnd);

    try {
      const item = usePlanner.getState().items[eventId];
      if (!item) throw new Error("Item not found");

      const conflicts = conflictsAt(startISO, endISO, eventId);
      if (conflicts.length) throw new Error("Conflicts with existing items");

      if (item.type === "event") {
        updateItem(eventId, { start: startISO, end: endISO });
        toast.success("Event resized");
      } else if (item.type === "task") {
        updateItem(eventId, { scheduledStart: startISO, scheduledEnd: endISO });
        toast.success("Task resized");
      }
    } catch (err: any) {
      resizeInfo.revert();
      toast.error(err.message ?? "Unable to resize due to conflict");
    }
  }

  function handleEventDrop(dropInfo: any) {
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;
    const startISO = isoDate(newStart);
    const endISO = isoDate(newEnd);

    try {
      const item = usePlanner.getState().items[eventId];
      if (!item) throw new Error("Item not found");

      const conflicts = conflictsAt(startISO, endISO, eventId);
      if (conflicts.length) throw new Error("Conflicts with existing items");

      if (item.type === "event") {
        updateItem(eventId, { start: startISO, end: endISO });
        toast.success("Event moved");
      } else if (item.type === "task") {
        updateItem(eventId, { scheduledStart: startISO, scheduledEnd: endISO });
        toast.success("Task moved");
      }
    } catch (err: any) {
      dropInfo.revert();
      toast.error(err.message ?? "Unable to move due to conflict");
    }
  }

  function handleEventClick(clickInfo: any) {
    const eventId = clickInfo.event.id;
    setEditingItemId(eventId);
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
        datesSet={handleDatesSet}
        initialDate={parseISO(weekStart)}
        headerToolbar={false}
        dayHeaderFormat={view === 'day' ? { weekday: 'long', day: 'numeric', month: 'short' } : view === 'month' ? { weekday: 'short' } : { weekday: 'short', day: 'numeric' }}
        slotDuration={view === 'month' ? undefined : "01:00:00"}
        slotLabelFormat={view === 'month' ? undefined : { hour: 'numeric', meridiem: false }}
        droppable={true}
        drop={handleExternalDrop}
        eventReceive={handleExternalDrop}
        editable={view !== 'month'}
        eventResize={view !== 'month' ? handleEventResize : undefined}
        eventDrop={view !== 'month' ? handleEventDrop : undefined}
        eventClick={handleEventClick}
        eventContent={(eventInfo) => (
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
        )}
      />

      {quickAdd ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-2 shadow z-50">
          <div className="flex gap-2 items-center">
            <Input
              autoFocus
              placeholder="New task title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
            />
            <Button onClick={handleQuickAdd}>Add</Button>
            <Button variant="ghost" onClick={() => setQuickAdd(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <EditItemDialog itemId={editingItemId} onClose={() => setEditingItemId(null)} />
    </div>
  );
});

