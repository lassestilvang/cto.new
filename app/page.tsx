"use client";

import { addDays, format, parseISO, setHours, setMinutes } from "date-fns";
import { usePlanner } from "@/lib/store";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";
import { TaskSidebar } from "@/components/sidebar/task-sidebar";
import { NewItemDialog } from "@/components/new-item-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { cn, isoDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function DragGhost() {
  return <div className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs shadow-xl">Moving…</div>;
}

export default function HomePage() {
  const weekStart = usePlanner(s => s.weekStart);
  const goToWeek = usePlanner(s => s.goToWeek);
  const scheduleTask = usePlanner(s => s.scheduleTask);
  const moveEvent = usePlanner(s => s.moveEvent);

  const start = parseISO(weekStart);
  const end = addDays(start, 4);
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(start, i)), [start]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; kind: string } | null>(null);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    const data = e.active.data.current as any;
    if (data) {
      setDraggedItem({ id: data.id, kind: data.kind });
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    setDraggedItem(null);
    if (!over) return;
    const data = active.data.current as any;
    const overData = over.data.current as any;
    if (!overData || overData.type !== "slot") return;
    const dayIdx: number = overData.dayIdx;
    const hour: number = overData.hour;
    const startISO = isoDate(setMinutes(setHours(days[dayIdx], hour), 0));
    const endISO = isoDate(setMinutes(setHours(days[dayIdx], hour + 1), 0));
    try {
      if (data.kind === "task") {
        scheduleTask(data.id, startISO, endISO);
        toast.success("Task scheduled");
      } else if (data.kind === "event") {
        moveEvent(String(active.id), startISO, endISO);
        toast.success("Event moved");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Unable to schedule due to conflict");
    }
  }

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-screen w-full overflow-hidden">
        <TaskSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <motion.div layoutId="topbar" className="border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => goToWeek(-1)} aria-label="Previous week">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => goToWeek(1)} aria-label="Next week">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground ml-2 flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                <span className={cn("font-medium text-foreground")}>{format(start, "MMMM")}</span>
                <span>–</span>
                <span>
                  {format(start, "EEE d")} → {format(end, "EEE d")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Future: user switcher, theme toggle */}
              <NewItemDialog />
            </div>
          </motion.div>
          <WeeklyCalendar draggedItem={draggedItem} />
        </div>
      </div>
      <DragOverlay>{activeId ? <DragGhost /> : null}</DragOverlay>
    </DndContext>
  );
}
