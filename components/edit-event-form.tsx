"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import type { CalendarEvent, Category } from "@/types/scheduler";
import { toast } from "sonner";
import { z } from "zod";
import { set, format, parseISO } from "date-fns";
import { usePlanner } from "@/lib/store";
import { isoDate } from "@/lib/utils";

const EventSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  category: z.enum(["Inbox", "Overdue", "Work", "Family", "Personal", "Travel"]),
  date: z.date(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
  attendees: z.string().optional(),
  sharedLabel: z.string().optional(),
});

interface EditEventFormProps {
  item: CalendarEvent;
  eventTitle: string;
  setEventTitle: (value: string) => void;
  eventDescription: string;
  setEventDescription: (value: string) => void;
  eventCategory: Category;
  setEventCategory: (value: Category) => void;
  eventDate: Date | undefined;
  setEventDate: (value: Date | undefined) => void;
  eventStart: string;
  setEventStart: (value: string) => void;
  eventEnd: string;
  setEventEnd: (value: string) => void;
  eventAllDay: boolean;
  setEventAllDay: (value: boolean) => void;
  eventAttendees: string;
  setEventAttendees: (value: string) => void;
  eventSharedLabel: string;
  setEventSharedLabel: (value: string) => void;
  onSubmit: () => void;
}

export function EditEventForm({
  item,
  eventTitle,
  setEventTitle,
  eventDescription,
  setEventDescription,
  eventCategory,
  setEventCategory,
  eventDate,
  setEventDate,
  eventStart,
  setEventStart,
  eventEnd,
  setEventEnd,
  eventAllDay,
  setEventAllDay,
  eventAttendees,
  setEventAttendees,
  eventSharedLabel,
  setEventSharedLabel,
  onSubmit
}: EditEventFormProps) {
  const updateItem = usePlanner(s => s.updateItem);
  const conflictsAt = usePlanner(s => s.conflictsAt);

  function submitEvent() {
    try {
      const data = {
        title: eventTitle,
        description: eventDescription || undefined,
        category: eventCategory,
        date: eventDate!,
        start: eventStart,
        end: eventEnd,
        allDay: eventAllDay,
        attendees: eventAttendees || undefined,
        sharedLabel: eventSharedLabel || undefined,
      };
      const parsed = EventSchema.parse(data);

      const [sh, sm] = parsed.start.split(":").map(Number);
      const [eh, em] = parsed.end.split(":").map(Number);
      const startDate = set(parsed.date, { hours: sh, minutes: sm, seconds: 0, milliseconds: 0 });
      const endDate = set(parsed.date, { hours: eh, minutes: em, seconds: 0, milliseconds: 0 });
      if (!parsed.allDay && endDate <= startDate) throw new Error("End must be after start");

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Check conflicts
      const conflicts = conflictsAt(startISO, endISO, item.id);
      if (conflicts.length) throw new Error("Conflicts with existing items");

      updateItem(item.id, {
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        start: startISO,
        end: endISO,
        allDay: parsed.allDay,
        attendees: parsed.attendees ? parsed.attendees.split(",").map(s => s.trim()) : [],
        sharedLabel: parsed.sharedLabel,
      });
      onSubmit();
      toast.success("Event updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid input");
    }
  }

  return (
    <div className="space-y-3">
      <Input placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
      <Textarea placeholder="Description" value={eventDescription} onChange={e => setEventDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Select value={eventCategory} onValueChange={(v: Category) => setEventCategory(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Inbox">Inbox</SelectItem>
            <SelectItem value="Work">Work</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Personal">Personal</SelectItem>
            <SelectItem value="Travel">Travel</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Checkbox id="allDay" checked={eventAllDay} onCheckedChange={(checked) => setEventAllDay(checked === true)} />
          <label htmlFor="allDay" className="text-sm">All day</label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Calendar mode="single" selected={eventDate} onSelect={setEventDate} />
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Start</label>
            <Input type="time" value={eventStart} onChange={e => setEventStart(e.target.value)} disabled={eventAllDay} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">End</label>
            <Input type="time" value={eventEnd} onChange={e => setEventEnd(e.target.value)} disabled={eventAllDay} />
          </div>
          <Input placeholder="Attendees (comma separated)" value={eventAttendees} onChange={e => setEventAttendees(e.target.value)} />
          <Input placeholder="Shared Label" value={eventSharedLabel} onChange={e => setEventSharedLabel(e.target.value)} />
        </div>
      </div>
    </div>
  );
}