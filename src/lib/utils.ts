import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert YYYY-MM-DD (HTML date format) to DD/MM/YYYY for display
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Convert DD/MM/YYYY to YYYY-MM-DD (HTML date format)
export function formatDateInput(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr; // Already in correct format
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}
