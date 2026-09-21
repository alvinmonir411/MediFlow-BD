import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBanglaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getTimeSlot(date: Date = new Date()): "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" {
  const hours = date.getHours();
  if (hours >= 6 && hours < 12) return "MORNING";
  if (hours >= 12 && hours < 16) return "AFTERNOON";
  if (hours >= 16 && hours < 20) return "EVENING";
  return "NIGHT";
}

export function parseFrequencyToSlots(freq: string): Array<"MORNING" | "AFTERNOON" | "NIGHT"> {
  // Common Bangladesh patterns: "1+0+1", "1+1+1", "0+0+1", "1+0+0"
  const clean = freq.trim();
  const slots: Array<"MORNING" | "AFTERNOON" | "NIGHT"> = [];
  
  if (clean.includes("+")) {
    const parts = clean.split("+").map(p => p.trim());
    if (parts[0] && parts[0] !== "0") slots.push("MORNING");
    if (parts[1] && parts[1] !== "0") slots.push("AFTERNOON");
    if (parts[2] && parts[2] !== "0") slots.push("NIGHT");
  } else if (clean.toLowerCase().includes("once")) {
    slots.push("MORNING");
  } else if (clean.toLowerCase().includes("twice")) {
    slots.push("MORNING");
    slots.push("NIGHT");
  } else {
    // Default
    slots.push("MORNING");
    slots.push("NIGHT");
  }

  return slots;
}
