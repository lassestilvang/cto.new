"use client";

import { addHours, format } from "date-fns";
import { toast } from "sonner";
import { usePlanner } from "@/lib/store";
import { isoDate } from "@/lib/utils";
import type { BlockItem, ScheduleConflict } from "@/types/scheduler";

interface CalendarEventHandlersConfig {
  view: 'week' | 'day' | 'month';
  draggedItem: { id: string; kind: string } | null;
  weekStart: string;
  goToWeek: (offset: number) => void;
  updateItem: (id: string, updates: any) => void;
  conflictsAt: (start: string, end: string, excludeId?: string) => ScheduleConflict[];
  scheduleTask: (taskId: string, start: string, end: string) => void;
  moveEvent: (eventId: string, start: string, end: string) => void;
  setEditingItemId: (id: string | null) => void;
  onSelect?: (selectInfo: any) => void;
  onDatesSet?: (dateInfo: any) => void;
  onExternalDrop?: (dropInfo: any) => void;
  onExternalDragStart?: (dragInfo: any) => void;
  onEventResize?: (resizeInfo: any) => void;
  onEventDrop?: (dropInfo: any) => void;
  onEventClick?: (clickInfo: any) => void;
}

interface EventHandlerFunctions {
  handleSelect: (selectInfo: any) => void;
  handleQuickAdd: () => void;
  handleDatesSet: (dateInfo: any) => void;
  handleExternalDrop: (dropInfo: any) => void;
  handleExternalDragStart: (dragInfo: any) => void;
  handleEventResize: (resizeInfo: any) => void;
  handleEventDrop: (dropInfo: any) => void;
  handleEventClick: (clickInfo: any) => void;
}

export function useCalendarEventHandlers(config: CalendarEventHandlersConfig): EventHandlerFunctions {
  const {
    view,
    draggedItem,
    weekStart,
    goToWeek,
    updateItem,
    conflictsAt,
    scheduleTask,
    moveEvent,
    setEditingItemId,
    onSelect,
    onDatesSet,
    onExternalDrop,
    onExternalDragStart,
    onEventResize,
    onEventDrop,
    onEventClick
  } = config;

  function handleSelect(selectInfo: any) {
    // Call the onSelect callback if provided (for external handling like quick add)
    if (onSelect) {
      onSelect(selectInfo);
      return;
    }
    
    // Default implementation - trigger quick add
    // This would typically be handled by the parent component
  }

  function handleQuickAdd() {
    // This function is typically handled by the parent component via onSelect callback
    // Kept for API compatibility
  }

  function handleDatesSet(dateInfo: any) {
    // Call the onDatesSet callback if provided (for external handling)
    if (onDatesSet) {
      onDatesSet(dateInfo);
      return;
    }

    // Default implementation
    const newWeekStart = format(dateInfo.start, "yyyy-MM-dd");
    if (newWeekStart !== weekStart) {
      if (view === 'day') {
        // For day view, navigate by day instead of week
        const offset = Math.round((new Date(newWeekStart).getTime() - new Date(weekStart).getTime()) / (24 * 60 * 60 * 1000));
        goToWeek(offset);
      } else if (view === 'month') {
        // For month view, set weekStart to the start of the displayed month
        const monthStart = new Date(dateInfo.start);
        monthStart.setDate(1); // First day of month
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
    // Call the onExternalDrop callback if provided (for external handling)
    if (onExternalDrop) {
      onExternalDrop(dropInfo);
      return;
    }

    // Default implementation
    if (!draggedItem) return;
    
    const { id, kind } = draggedItem;
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
    // Call the onExternalDragStart callback if provided
    if (onExternalDragStart) {
      onExternalDragStart(dragInfo);
      return;
    }

    // Default implementation - currently empty as noted in original code
  }

  function handleEventResize(resizeInfo: any) {
    // Call the onEventResize callback if provided (for external handling)
    if (onEventResize) {
      onEventResize(resizeInfo);
      return;
    }

    // Default implementation
    const eventId = resizeInfo.event.id;
    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;
    
    if (!newStart || !newEnd) {
      resizeInfo.revert();
      toast.error("Invalid event time");
      return;
    }

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
    // Call the onEventDrop callback if provided (for external handling)
    if (onEventDrop) {
      onEventDrop(dropInfo);
      return;
    }

    // Default implementation
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;
    
    if (!newStart || !newEnd) {
      dropInfo.revert();
      toast.error("Invalid event time");
      return;
    }

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
    // Call the onEventClick callback if provided (for external handling)
    if (onEventClick) {
      onEventClick(clickInfo);
      return;
    }

    // Default implementation
    const eventId = clickInfo.event.id;
    setEditingItemId(eventId);
  }

  return {
    handleSelect,
    handleQuickAdd,
    handleDatesSet,
    handleExternalDrop,
    handleExternalDragStart,
    handleEventResize,
    handleEventDrop,
    handleEventClick,
  };
}

export function CalendarEventHandlers(props: CalendarEventHandlersProps) {
  // The actual event handlers are now provided via the useCalendarEventHandlers hook
  // This component exists for backward compatibility and can be extended in the future
  return null;
}

// Legacy interface for backward compatibility
interface CalendarEventHandlersProps {
  view: 'week' | 'day' | 'month';
  draggedItem: { id: string; kind: string } | null;
  weekStart: string;
  goToWeek: (offset: number) => void;
  updateItem: (id: string, updates: any) => void;
  conflictsAt: (start: string, end: string, excludeId?: string) => BlockItem[];
  scheduleTask: (taskId: string, start: string, end: string) => void;
  moveEvent: (eventId: string, start: string, end: string) => void;
  setEditingItemId: (id: string | null) => void;
  onSelect: (selectInfo: any) => void;
  onDatesSet: (dateInfo: any) => void;
  onExternalDrop: (dropInfo: any) => void;
  onEventResize: (resizeInfo: any) => void;
  onEventDrop: (dropInfo: any) => void;
  onEventClick: (clickInfo: any) => void;
}