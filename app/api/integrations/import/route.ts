import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Category, Priority } from "@/types/scheduler";

const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["Inbox", "Overdue", "Work", "Family", "Personal", "Travel"] as const).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high"] as const).optional(),
  completed: z.boolean().optional()
});

const Body = z.object({
  provider: z.enum(["notion", "clickup", "linear", "todoist"]).optional(),
  tasks: z.array(TaskSchema).min(1, "At least one task is required")
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { provider, tasks } = parsed.data;
    const normalized = tasks.map(t => ({
      title: t.title,
      description: t.description,
      category: t.category ?? "Inbox",
      dueDate: t.dueDate,
      priority: t.priority ?? "medium",
      completed: t.completed ?? false
    }));

    // TODO: Integrate with store or DB
    return NextResponse.json({ provider, tasks: normalized });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
