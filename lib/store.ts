"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, startOfWeek, formatISO, setHours, setMinutes, isBefore, addHours, isSameDay } from "date-fns";
import type { BlockItem, CalendarEvent, PlannerState, ScheduleConflict, Task, Category } from "@/types/scheduler";
import { isoDate } from "@/lib/utils";
import { nanoid } from "nanoid";

export const CategoryColor: Record<Category, string> = {
  Inbox: "#60a5fa",
  Overdue: "#ef4444",
  Work: "#3b82f6",
  Family: "#22c55e",
  Personal: "#f59e0b",
  Travel: "#a855f7"
};

export interface Actions {
  goToWeek(offset: number): void;
  setSelectedDate(d: Date): void;
  addTask(input: Partial<Task> & { title: string }): string;
  addEvent(input: Partial<CalendarEvent> & { title: string; start: string; end: string }): string;
  updateItem(id: string, patch: Partial<BlockItem>): void;
  removeItem(id: string): void;
  scheduleTask(id: string, start: string, end: string): void;
  moveEvent(id: string, start: string, end: string): void;
  conflictsAt(start: string, end: string, excludeId?: string): ScheduleConflict[];
  getItemsForDay(d: Date): BlockItem[];
}

export type PlannerStore = PlannerState & Actions;

function weekStartISO(d = new Date()) {
  return formatISO(startOfWeek(d, { weekStartsOn: 1 }), { representation: "date" });
}

const initialState: PlannerState = {
  weekStart: weekStartISO(),
  selectedDate: formatISO(new Date(), { representation: "date" }),
  items: {},
  order: [],
  collaborators: [
    { id: "u1", name: "You" },
    { id: "u2", name: "Sara" },
    { id: "u3", name: "John" }
  ],
  currentUserId: "u1"
};

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

function isSameDayUTC(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() &&
          a.getUTCMonth() === b.getUTCMonth() &&
          a.getUTCDate() === b.getUTCDate();
}

function isSameDayLocal(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();
}

export const usePlanner = create<PlannerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      goToWeek(offset) {
        const base = new Date(get().weekStart);
        const next = addDays(base, offset * 7);
        set({ weekStart: weekStartISO(next) });
      },

      setSelectedDate(d) {
        set({ selectedDate: formatISO(d, { representation: "date" }) });
      },

      addTask(input) {
        const id = input.id ?? nanoid();
        const task: Task = {
          id,
          type: "task",
          title: input.title,
          description: input.description,
          category: input.category ?? "Inbox",
          color: input.color ?? CategoryColor[input.category ?? "Inbox"],
          dueDate: input.dueDate,
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
          completed: input.completed ?? false,
          priority: input.priority ?? "medium",
          subtasks: input.subtasks ?? [],
          overdue: input.dueDate ? isBefore(new Date(input.dueDate), new Date()) && !input.completed : false,
          sharedWith: input.sharedWith ?? []
        };
        set(s => ({ items: { ...s.items, [id]: task }, order: [id, ...s.order] }));
        return id;
      },

      addEvent(input) {
        const id = input.id ?? nanoid();
        const event: CalendarEvent = {
          id,
          type: "event",
          title: input.title,
          description: input.description,
          category: input.category ?? "Work",
          color: input.color ?? CategoryColor[input.category ?? "Work"],
          start: input.start,
          end: input.end,
          attendees: input.attendees ?? [],
          allDay: input.allDay ?? false,
          sharedLabel: input.sharedLabel,
          source: input.source ?? "local"
        };
        set(s => ({ items: { ...s.items, [id]: event }, order: [id, ...s.order] }));
        return id;
      },

      updateItem(id, patch) {
        set(s => ({ items: { ...s.items, [id]: { ...s.items[id], ...patch } as BlockItem } }));
      },

      removeItem(id) {
        set(s => {
          const { [id]: _, ...rest } = s.items;
          return { items: rest, order: s.order.filter(x => x !== id) };
        });
      },

      scheduleTask(id, startISO, endISO) {
        const item = get().items[id];
        if (!item || item.type !== "task") throw new Error("Not a task");
        const conflicts = get().conflictsAt(startISO, endISO);
        if (conflicts.length) throw new Error("Conflicts with existing items");
        get().updateItem(id, { scheduledStart: startISO, scheduledEnd: endISO });
      },

      moveEvent(id, startISO, endISO) {
        const item = get().items[id];
        if (!item || item.type !== "event") throw new Error("Not an event");
        const conflicts = get().conflictsAt(startISO, endISO, id);
        if (conflicts.length) throw new Error("Conflicts with existing items");
        get().updateItem(id, { start: startISO, end: endISO });
      },

      conflictsAt(startISO, endISO, excludeId) {
        const start = new Date(startISO);
        const end = new Date(endISO);
        const res: ScheduleConflict[] = [];
        const all = Object.values(get().items);
        for (const it of all) {
          if (it.id === excludeId) continue;
          const aStart = it.type === "event" ? new Date(it.start) : it.scheduledStart ? new Date(it.scheduledStart) : null;
          const aEnd = it.type === "event" ? new Date(it.end) : it.scheduledEnd ? new Date(it.scheduledEnd) : null;
          if (!aStart || !aEnd) continue;
          if (overlaps(start, end, aStart, aEnd)) {
            const overlapMinutes = Math.max(0, (Math.min(+end, +aEnd) - Math.max(+start, +aStart)) / 60000);
            res.push({ aId: it.id, bId: excludeId ?? "new", overlapMinutes });
          }
        }
        return res;
      },

      getItemsForDay(d) {
        const result: BlockItem[] = [];
        // Convert input date to UTC date string to match how events are stored
        const targetDate = formatISO(d, { representation: "date" });
        for (const it of Object.values(get().items)) {
          if (it.type === "event") {
            const eventDate = formatISO(new Date(it.start), { representation: "date" });
            if (eventDate === targetDate) result.push(it);
          } else {
            if (it.scheduledStart) {
              const taskDate = formatISO(new Date(it.scheduledStart), { representation: "date" });
              if (taskDate === targetDate) result.push(it);
            }
          }
        }
        return result.sort((a, b) => {
          const aStart = a.type === "event" ? a.start : a.scheduledStart;
          const bStart = b.type === "event" ? b.start : b.scheduledStart;
          if (!aStart && !bStart) return 0;
          if (!aStart) return 1;
          if (!bStart) return -1;
          return +new Date(aStart) - +new Date(bStart);
        });
      }
    }),
    { name: "unified-planner-store" }
  )
);

// Seed some demo content on first run
if (typeof window !== "undefined") {
  const hasSeeded = localStorage.getItem("planner-seeded");
  if (!hasSeeded) {
    const store = usePlanner.getState();
    const now = new Date();
    const today9 = setMinutes(setHours(now, 9), 0);
    const today10 = addHours(today9, 1);
    const today13 = setMinutes(setHours(now, 13), 0);
    const today14 = addHours(today13, 1);

    store.addEvent({
      title: "Standup",
      category: "Work",
      start: isoDate(today9),
      end: isoDate(today10),
      attendees: ["u2"],
      sharedLabel: "You:Sara"
    });

    const taskId = store.addTask({ title: "Plan user interviews", category: "Work", subtasks: [
      { id: nanoid(), title: "w/Roger", completed: false },
      { id: nanoid(), title: "w/Julia", completed: false },
      { id: nanoid(), title: "w/Paul", completed: false }
    ] });
    store.scheduleTask(taskId, isoDate(today13), isoDate(today14));

    localStorage.setItem("planner-seeded", "1");
  }
}