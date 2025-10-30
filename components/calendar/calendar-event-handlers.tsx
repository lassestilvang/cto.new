"use client";

import { addHours } from "date-fns";
import { toast } from "sonner";
import { usePlanner } from "@/lib/store";
import { isoDate } from "@/lib/utils";
import type { BlockItem } from "@/types/scheduler";

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

export function CalendarEventHandlers(props: CalendarEventHandlersProps) {
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
    onEventResize,
    onEventDrop,
    onEventClick
  } = props;

  // Event handlers are already defined in parent - this component provides the structure
  return null;
}