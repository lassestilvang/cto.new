"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task, Category, Priority } from "@/types/scheduler";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";
import { usePlanner } from "@/lib/store";

const TaskSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  category: z.enum(["Inbox", "Overdue", "Work", "Family", "Personal", "Travel"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
});

interface EditTaskFormProps {
  item: Task;
  taskTitle: string;
  setTaskTitle: (value: string) => void;
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  taskCategory: Category;
  setTaskCategory: (value: Category) => void;
  taskPriority: Priority;
  setTaskPriority: (value: Priority) => void;
  taskDueDate: Date | undefined;
  setTaskDueDate: (value: Date | undefined) => void;
  taskScheduledStart: string;
  setTaskScheduledStart: (value: string) => void;
  taskScheduledEnd: string;
  setTaskScheduledEnd: (value: string) => void;
  onSubmit: () => void;
}

export function EditTaskForm({
  item,
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskCategory,
  setTaskCategory,
  taskPriority,
  setTaskPriority,
  taskDueDate,
  setTaskDueDate,
  taskScheduledStart,
  setTaskScheduledStart,
  taskScheduledEnd,
  setTaskScheduledEnd,
  onSubmit
}: EditTaskFormProps) {
  const updateItem = usePlanner(s => s.updateItem);
  const conflictsAt = usePlanner(s => s.conflictsAt);

  function submitTask() {
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
      onSubmit();
      toast.success("Task updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid input");
    }
  }

  return (
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
  );
}