"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  );
}