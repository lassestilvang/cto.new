"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { set, parseISO, format } from "date-fns";
import { usePlanner } from "@/lib/store";
import { z } from "zod";
import { toast } from "sonner";
import type { BlockItem, Task, CalendarEvent, Category, Priority } from "@/types/scheduler";

const TaskSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  category: z.enum(["Inbox", "Overdue", "Work", "Family", "Personal", "Travel"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
});

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

interface EditItemDialogProps {
  itemId: string | null;
  onClose: () => void;
}

export function EditItemDialog({ itemId, onClose }: EditItemDialogProps) {
  const [item, setItem] = useState<BlockItem | null>(null);
  const [isTask, setIsTask] = useState(false);
  const updateItem = usePlanner(s => s.updateItem);
  const conflictsAt = usePlanner(s => s.conflictsAt);

  // Task fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState<Category>("Inbox");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>();
  const [taskScheduledStart, setTaskScheduledStart] = useState("");
  const [taskScheduledEnd, setTaskScheduledEnd] = useState("");

  // Event fields
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState<Category>("Work");
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [eventStart, setEventStart] = useState("09:00");
  const [eventEnd, setEventEnd] = useState("10:00");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventAttendees, setEventAttendees] = useState("");
  const [eventSharedLabel, setEventSharedLabel] = useState("");

  useEffect(() => {
    if (itemId) {
      const currentItem = usePlanner.getState().items[itemId];
      if (currentItem) {
        setItem(currentItem);
        setIsTask(currentItem.type === "task");

        if (currentItem.type === "task") {
          const task = currentItem as Task;
          setTaskTitle(task.title);
          setTaskDescription(task.description || "");
          setTaskCategory(task.category);
          setTaskPriority(task.priority);
          setTaskDueDate(task.dueDate ? parseISO(task.dueDate) : undefined);
          setTaskScheduledStart(task.scheduledStart || "");
          setTaskScheduledEnd(task.scheduledEnd || "");
        } else {
          const event = currentItem as CalendarEvent;
          setEventTitle(event.title);
          setEventDescription(event.description || "");
          setEventCategory(event.category);
          const startDate = parseISO(event.start);
          setEventDate(startDate);
          setEventStart(format(startDate, "HH:mm"));
          setEventEnd(format(parseISO(event.end), "HH:mm"));
          setEventAllDay(event.allDay || false);
          setEventAttendees(event.attendees?.join(", ") || "");
          setEventSharedLabel(event.sharedLabel || "");
        }
      }
    }
  }, [itemId]);

  function submitTask() {
    if (!item) return;
    try {
      const data = {
        title: taskTitle,
        description: taskDescription || undefined,
        category: taskCategory,
        priority: taskPriority,
        dueDate: taskDueDate ? format(taskDueDate, "yyyy-MM-dd") : undefined,
        scheduledStart: taskScheduledStart || undefined,
        scheduledEnd: taskScheduledEnd || undefined,
      };
      const parsed = TaskSchema.parse(data);

      // Check conflicts if scheduling times changed
      if (parsed.scheduledStart && parsed.scheduledEnd) {
        const conflicts = conflictsAt(parsed.scheduledStart, parsed.scheduledEnd, item.id);
        if (conflicts.length) throw new Error("Conflicts with existing items");
      }

      updateItem(item.id, parsed);
      onClose();
      toast.success("Task updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid input");
    }
  }

  function submitEvent() {
    if (!item) return;
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
      onClose();
      toast.success("Event updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid input");
    }
  }

  if (!itemId || !item) return null;

  return (
    <Dialog open={!!itemId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {isTask ? "Task" : "Event"}</DialogTitle>
        </DialogHeader>
        {isTask ? (
          <div className="space-y-3">
            <Input placeholder="Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
            <Textarea placeholder="Description" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={taskCategory} onValueChange={(v: Category) => setTaskCategory(v)}>
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
              <Select value={taskPriority} onValueChange={(v: Priority) => setTaskPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Due Date</label>
                <Calendar mode="single" selected={taskDueDate} onSelect={setTaskDueDate} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Scheduled Start</label>
                <Input type="datetime-local" value={taskScheduledStart} onChange={e => setTaskScheduledStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Scheduled End</label>
                <Input type="datetime-local" value={taskScheduledEnd} onChange={e => setTaskScheduledEnd(e.target.value)} />
              </div>
            </div>
          </div>
        ) : (
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
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={isTask ? submitTask : submitEvent}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}