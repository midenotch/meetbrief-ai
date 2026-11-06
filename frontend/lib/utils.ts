import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMeetingDate(date: string): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeDate(date: string): string {
  const d = new Date(date);
  if (isPast(d)) {
    return `${formatDistanceToNow(d)} ago`;
  }
  return `in ${formatDistanceToNow(d)}`;
}

export function formatShortDate(date: string): string {
  return format(new Date(date), "MMM d, yyyy");
}
