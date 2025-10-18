import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(["Inbox", "Overdue", "Work", "Family", "Personal", "Travel"]).optional(),
  dueDate: z.string().optional()
});

const Body = z.object({
  provider: z.enum(["notion", "clickup", "linear", "todoist"]).optional(),
  tasks: z.array(TaskSchema)
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { provider, tasks } = parsed.data;
  const normalized = tasks.map(t => ({
    title: t.title,
    description: t.description,
    category: t.category ?? "Inbox",
    dueDate: t.dueDate
  }));

  return NextResponse.json({ provider, tasks: normalized });
}
