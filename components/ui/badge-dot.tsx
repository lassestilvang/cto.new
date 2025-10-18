import { cn } from "@/lib/utils";

export function BadgeDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", className)} style={{ backgroundColor: color }} />;
}
