"use client";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditItemHeaderProps {
  isTask: boolean;
}

export function EditItemHeader({ isTask }: EditItemHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>Edit {isTask ? "Task" : "Event"}</DialogTitle>
    </DialogHeader>
  );
}