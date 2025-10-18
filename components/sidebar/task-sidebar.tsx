"use client";

import { useMemo, useState } from "react";
import { usePlanner, CategoryColor } from "@/lib/store";
import type { Task, Category } from "@/types/scheduler";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BadgeDot } from "@/components/ui/badge-dot";
import { useDraggable } from "@dnd-kit/core";
import { ChevronDown, ChevronRight, Inbox, CalendarPlus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS: Category[] = ["Inbox", "Overdue", "Work", "Family", "Personal", "Travel"];

export function TaskSidebar() {
  const items = usePlanner(s => s.items);
  const addTask = usePlanner(s => s.addTask);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Overdue: false });
  const [title, setTitle] = useState("");

  const tasksByGroup = useMemo(() => {
    const entries: Record<Category, Task[]> = {
      Inbox: [], Overdue: [], Work: [], Family: [], Personal: [], Travel: []
    };
    for (const it of Object.values(items)) {
      if (it.type === "task") {
        const overdue = it.dueDate ? new Date(it.dueDate) < new Date() && !it.completed : false;
        const cat = overdue ? "Overdue" : it.category;
        entries[cat].push({ ...it, overdue });
      }
    }
    return entries;
  }, [items]);

  function handleAddQuick() {
    if (!title.trim()) return;
    addTask({ title: title.trim(), category: "Inbox" });
    setTitle("");
  }

  const overdueCount = tasksByGroup.Overdue.length;

  return (
    <div className="w-80 border-r border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Input placeholder="Quick add task" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddQuick()} />
          <Button size="icon" onClick={handleAddQuick}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          <Inbox className="h-3.5 w-3.5" /> Inbox · <CalendarPlus className="h-3.5 w-3.5" /> drag to schedule
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Collaborators</div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <Separator />
          {GROUPS.map(group => (
            <div key={group} className="">
              <button className="w-full flex items-center justify-between text-left text-sm font-medium" onClick={() => setCollapsed(s => ({ ...s, [group]: !s[group] }))}>
                <div className="flex items-center gap-2">
                  {collapsed[group] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <BadgeDot color={CategoryColor[group]} />
                  <span>{group}</span>
                </div>
                {group === "Overdue" && overdueCount > 0 ? (
                  <Badge variant="destructive" className="border-0">{overdueCount}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{tasksByGroup[group].length}</span>
                )}
              </button>
              {!collapsed[group] && (
                <div className="mt-2 space-y-1">
                  {tasksByGroup[group].length === 0 ? (
                    <div className="text-xs text-muted-foreground px-6">No tasks</div>
                  ) : (
                    tasksByGroup[group].map(t => <TaskRow key={t.id} task={t} />)
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
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
