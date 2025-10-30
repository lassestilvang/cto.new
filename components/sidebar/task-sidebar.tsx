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
import { ChevronDown, ChevronRight, Inbox, CalendarPlus, Plus, Users } from "lucide-react";
import { TaskRow } from "@/components/task-row";

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
