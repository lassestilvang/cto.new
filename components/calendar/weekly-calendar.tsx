"use client";

import { addDays, format, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { usePlanner } from "@/lib/store";
import { hoursRange, isoDate, timeToLabel, cn } from "@/lib/utils";
import type { BlockItem } from "@/types/scheduler";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HOURS = hoursRange(6, 22);

export function WeeklyCalendar() {
  const weekStart = usePlanner(s => s.weekStart);
  const getItemsForDay = usePlanner(s => s.getItemsForDay);
  const addTask = usePlanner(s => s.addTask);
  const [quickAdd, setQuickAdd] = useState<{ dayIdx: number; hour: number } | null>(null);
  const [title, setTitle] = useState("");

  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(parseISO(weekStart), i)), [weekStart]);

  function handleSlotClick(dayIdx: number, hour: number) {
    setQuickAdd({ dayIdx, hour });
  }

  function handleQuickAdd() {
    if (!quickAdd || !title.trim()) return;
    const d = days[quickAdd.dayIdx];
    const start = isoDate(setMinutes(setHours(d, quickAdd.hour), 0));
    const end = isoDate(setMinutes(setHours(d, quickAdd.hour + 1), 0));
    addTask({ title: title.trim(), category: "Inbox", scheduledStart: start, scheduledEnd: end });
    setTitle("");
    setQuickAdd(null);
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(5,1fr)] h-full">
        <TimeColumn />
        {days.map((d, i) => (
          <DayColumn key={i} day={d} dayIdx={i} onSlotClick={handleSlotClick} items={getItemsForDay(d)} />
        ))}
      </div>

      {quickAdd ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-2 shadow">
          <div className="flex gap-2 items-center">
            <Input autoFocus placeholder="New task title" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuickAdd()} />
            <Button onClick={handleQuickAdd}>Add</Button>
            <Button variant="ghost" onClick={() => setQuickAdd(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimeColumn() {
  return (
    <div className="border-r border-border">
      <div className="h-10 border-b border-border" />
      {HOURS.map(h => (
        <div key={h} className="h-16 text-[10px] text-muted-foreground px-2 border-b border-border flex items-start pt-1">
          {timeToLabel(h)}
        </div>
      ))}
    </div>
  );
}

function DayColumn({ day, dayIdx, items, onSlotClick }: { day: Date; dayIdx: number; items: BlockItem[]; onSlotClick: (dayIdx: number, hour: number) => void }) {
  return (
    <div className="relative border-r border-border min-w-0">
      <div className="h-10 border-b border-border px-2 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium mr-1">{format(day, "EEE")}</span>
          <span className="text-muted-foreground">{format(day, "d")}</span>
        </div>
      </div>
      <div className="relative">
        {HOURS.map(h => (
          <HourSlot key={h} day={day} dayIdx={dayIdx} hour={h} onClick={() => onSlotClick(dayIdx, h)} />
        ))}
        {items.map(it => (
          <CalendarBlock key={it.id} day={day} item={it} />
        ))}
      </div>
    </div>
  );
}

function HourSlot({ day, dayIdx, hour, onClick }: { day: Date; dayIdx: number; hour: number; onClick: () => void }) {
  const id = `${format(day, "yyyy-MM-dd")}-${hour}`;
  const { setNodeRef } = useDroppable({ id, data: { type: "slot", dayIdx, hour } });
  return (
    <div ref={setNodeRef} className="h-16 border-b border-border/60 hover:bg-accent/30 transition-colors relative" onClick={onClick} />
  );
}

function CalendarBlock({ day, item }: { day: Date; item: BlockItem }) {
  const start = item.type === "event" ? new Date(item.start) : item.scheduledStart ? new Date(item.scheduledStart) : null;
  const end = item.type === "event" ? new Date(item.end) : item.scheduledEnd ? new Date(item.scheduledEnd) : null;
  if (!start || !end) return null;
  const dayStart = startOfDay(day);
  const top = ((+start - +setHours(dayStart, 6)) / 3600000) * 64; // 64px per hour from 6
  const height = (+(end) - +start) / 3600000 * 64;

  return (
    <DraggableBlock id={item.id}>
      <motion.div layout className="absolute left-2 right-2 rounded-md p-2 text-xs shadow-lg"
        style={{ top: Math.max(0, top), height: Math.max(28, height), backgroundColor: item.color }}>
        <div className="font-medium text-white/90 truncate">{item.title}</div>
        <div className="text-white/80 opacity-80 flex items-center justify-between">
          <span>{item.category}</span>
          {item.type === "event" && item.sharedLabel ? (
            <span className="ml-2 bg-black/20 rounded px-1.5 py-0.5">{item.sharedLabel}</span>
          ) : null}
        </div>
      </motion.div>
    </DraggableBlock>
  );
}

function DraggableBlock({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { kind: "event" } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && "opacity-50")}>{children}</div>
  );
}
