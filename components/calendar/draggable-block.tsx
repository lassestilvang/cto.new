"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { BlockItem } from "@/types/scheduler";

export function DraggableBlock({ id, item, children }: { id: string; item: BlockItem; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { kind: item.type, id: item.id } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && "opacity-50")}>{children}</div>
  );
}