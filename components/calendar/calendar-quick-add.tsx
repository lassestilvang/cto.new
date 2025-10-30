"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CalendarQuickAddProps {
  quickAdd: { start: Date; end: Date } | null;
  setQuickAdd: (value: { start: Date; end: Date } | null) => void;
  addTask: (task: any) => void;
  title: string;
  setTitle: (value: string) => void;
}

export function CalendarQuickAdd({ quickAdd, setQuickAdd, addTask, title, setTitle }: CalendarQuickAddProps) {
  const handleQuickAdd = () => {
    if (!quickAdd || !title.trim()) return;
    addTask({
      title: title.trim(),
      category: "Inbox",
      scheduledStart: quickAdd.start.toISOString(),
      scheduledEnd: quickAdd.end.toISOString()
    });
    setTitle("");
    setQuickAdd(null);
  };

  if (!quickAdd) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-2 shadow z-50">
      <div className="flex gap-2 items-center">
        <Input
          autoFocus
          placeholder="New task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
        />
        <Button onClick={handleQuickAdd}>Add</Button>
        <Button variant="ghost" onClick={() => setQuickAdd(null)}>Cancel</Button>
      </div>
    </div>
  );
}