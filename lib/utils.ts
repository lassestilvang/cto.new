import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hoursRange(start = 6, end = 22) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function timeToLabel(hour: number) {
  const h = hour % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const disp = h % 12 === 0 ? 12 : h % 12;
  return `${disp}:00 ${suffix}`;
}

export function isoDate(d: Date) {
  const dt = new Date(d);
  dt.setMinutes(0, 0, 0);
  return dt.toISOString();
}
