"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { parseISO, format } from "date-fns";
import { usePlanner } from "@/lib/store";
import type { BlockItem, Task, CalendarEvent, Category, Priority } from "@/types/scheduler";
import { EditItemHeader } from "@/components/edit-item-header";
import { EditItemFooter } from "@/components/edit-item-footer";
import { EditTaskForm } from "@/components/edit-task-form";
import { EditEventForm } from "@/components/edit-event-form";

interface EditItemDialogProps {
  itemId: string | null;
  onClose: () => void;
}

export function EditItemDialog({ itemId, onClose }: EditItemDialogProps) {
  const [item, setItem] = useState<BlockItem | null>(null);
  const [isTask, setIsTask] = useState(false);

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

  if (!itemId || !item) return null;

  return (
    <Dialog open={!!itemId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <EditItemHeader isTask={isTask} />
        {isTask ? (
          <EditTaskForm
            item={item as Task}
            taskTitle={taskTitle}
            setTaskTitle={setTaskTitle}
            taskDescription={taskDescription}
            setTaskDescription={setTaskDescription}
            taskCategory={taskCategory}
            setTaskCategory={setTaskCategory}
            taskPriority={taskPriority}
            setTaskPriority={setTaskPriority}
            taskDueDate={taskDueDate}
            setTaskDueDate={setTaskDueDate}
            taskScheduledStart={taskScheduledStart}
            setTaskScheduledStart={setTaskScheduledStart}
            taskScheduledEnd={taskScheduledEnd}
            setTaskScheduledEnd={setTaskScheduledEnd}
            onSubmit={onClose}
          />
        ) : (
          <EditEventForm
            item={item as CalendarEvent}
            eventTitle={eventTitle}
            setEventTitle={setEventTitle}
            eventDescription={eventDescription}
            setEventDescription={setEventDescription}
            eventCategory={eventCategory}
            setEventCategory={setEventCategory}
            eventDate={eventDate}
            setEventDate={setEventDate}
            eventStart={eventStart}
            setEventStart={setEventStart}
            eventEnd={eventEnd}
            setEventEnd={setEventEnd}
            eventAllDay={eventAllDay}
            setEventAllDay={setEventAllDay}
            eventAttendees={eventAttendees}
            setEventAttendees={setEventAttendees}
            eventSharedLabel={eventSharedLabel}
            setEventSharedLabel={setEventSharedLabel}
            onSubmit={onClose}
          />
        )}
        <EditItemFooter
          onClose={onClose}
          onSubmit={() => {}}
          isTask={isTask}
        />
      </DialogContent>
    </Dialog>
  );
}