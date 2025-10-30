"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/store";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/scheduler";

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { kind: "task", id: task.id } });
  const update = usePlanner(s => s.updateItem);
  const [open, setOpen] = useState(false);
  return (
    <div className="px-2">
      <div ref={setNodeRef} {...listeners} {...attributes} className={cn("px-4 py-2 rounded hover:bg-accent/50 cursor-grab active:cursor-grabbing", isDragging && "opacity-50")}
        style={{ borderLeft: `2px solid ${task.color}` }}
        onDoubleClick={() => setOpen(v => !v)}>
        <div className="text-sm font-medium truncate">{task.title}</div>
        <div className="text-xs text-muted-foreground">{task.category}{task.subtasks && task.subtasks.length ? ` • ${task.subtasks.filter(s=>s.completed).length}/${task.subtasks.length}` : ''}</div>
      </div>
      {open && task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-1 ml-6 space-y-1">
          {task.subtasks.map(st => (
            <label key={st.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={st.completed} onChange={() => {
                const next = (task.subtasks ?? []).map(x => x.id === st.id ? { ...x, completed: !x.completed } : x);
                update(task.id, { subtasks: next });
              }} />
              <span className={cn(st.completed && 'line-through')}>{st.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}