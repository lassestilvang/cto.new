export type Category = "Inbox" | "Overdue" | "Work" | "Family" | "Personal" | "Travel";

export type Priority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface BaseItem {
  id: string;
  title: string;
  description?: string;
  category: Category;
  color: string; // hex or hsl string
}

export interface Task extends BaseItem {
  type: "task";
  dueDate?: string; // ISO date string
  scheduledStart?: string; // ISO date-time
  scheduledEnd?: string; // ISO date-time
  completed: boolean;
  priority: Priority;
  subtasks?: Subtask[];
  overdue?: boolean;
  sharedWith?: string[]; // user ids
}

export interface CalendarEvent extends BaseItem {
  type: "event";
  start: string; // ISO date-time
  end: string; // ISO date-time
  allDay?: boolean;
  attendees?: string[]; // user ids or emails
  sharedLabel?: string; // e.g., "John:Sara"
  source?: "local" | "google" | "outlook" | "apple" | "fastmail";
}

export type BlockItem = Task | CalendarEvent;

export interface PlannerState {
  weekStart: string; // ISO date of Monday 00:00
  selectedDate: string; // ISO date
  items: Record<string, BlockItem>; // by id
  order: string[]; // maintain order consistency
  currentUserId?: string;
  collaborators: { id: string; name: string; avatar?: string }[];
}

export interface ScheduleConflict {
  aId: string;
  bId: string;
  overlapMinutes: number;
}
