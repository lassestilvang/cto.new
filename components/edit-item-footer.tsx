"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface EditItemFooterProps {
  onClose: () => void;
  onSubmit: () => void;
  isTask: boolean;
}

export function EditItemFooter({ onClose, onSubmit, isTask }: EditItemFooterProps) {
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit}>Update</Button>
    </DialogFooter>
  );
}