"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { set } from "date-fns";
import { usePlanner } from "@/lib/store";
import { z } from "zod";
import { toast } from "sonner";

const Schema = z.object({
  title: z.string().min(1, "Title required"),
  date: z.date(),
  start: z.string(),
  end: z.string()
});

export function NewItemDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const addEvent = usePlanner(s => s.addEvent);

  function submit() {
    try {
      const parsed = Schema.parse({ title, date, start, end });
      const [sh, sm] = parsed.start.split(":").map(Number);
      const [eh, em] = parsed.end.split(":").map(Number);
      const startDate = set(parsed.date, { hours: sh, minutes: sm, seconds: 0, milliseconds: 0 });
      const endDate = set(parsed.date, { hours: eh, minutes: em, seconds: 0, milliseconds: 0 });
      if (endDate <= startDate) throw new Error("End must be after start");
      addEvent({ title: parsed.title, category: "Work", start: startDate.toISOString(), end: endDate.toISOString() });
      setOpen(false);
      setTitle("");
      toast.success("Event added");
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid input");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">New</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Calendar mode="single" selected={date} onSelect={setDate} />
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start</label>
                <Input type="time" value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End</label>
                <Input type="time" value={end} onChange={e => setEnd(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
