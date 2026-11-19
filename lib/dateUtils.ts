import {
  isToday,
  isThisWeek,
  isPast,
  isTomorrow,
  format,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";

export type DueIndicatorColor = "red" | "yellow" | "green" | "neutral";

export function getAssignmentStatus(
  dueDateStr: string,
  isCompleted?: boolean
): {
  color: DueIndicatorColor;
  label: string;
  badgeClass: string;
  borderClass: string;
  dotClass: string;
  urgencyOrder: number;
} {
  if (isCompleted) {
    return {
      color: "green",
      label: "Completed",
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      borderClass: "border-l-emerald-500",
      dotClass: "bg-emerald-500",
      urgencyOrder: 999,
    };
  }

  const dueDate = parseISO(dueDateStr);

  if (isToday(dueDate)) {
    return {
      color: "red",
      label: "Due Today",
      badgeClass:
        "bg-rose-50 text-rose-700 border-rose-200 animate-pulse dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
      borderClass: "border-l-rose-500 ring-1 ring-rose-300 dark:ring-rose-800",
      dotClass: "bg-rose-500",
      urgencyOrder: 1,
    };
  }

  if (isPast(dueDate)) {
    return {
      color: "red",
      label: "Overdue",
      badgeClass:
        "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700",
      borderClass: "border-l-rose-600",
      dotClass: "bg-rose-600",
      urgencyOrder: 0,
    };
  }

  if (isTomorrow(dueDate)) {
    return {
      color: "yellow",
      label: "Due Tomorrow",
      badgeClass:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      borderClass: "border-l-amber-500",
      dotClass: "bg-amber-500",
      urgencyOrder: 2,
    };
  }

  if (isThisWeek(dueDate, { weekStartsOn: 1 })) {
    return {
      color: "yellow",
      label: "Due This Week",
      badgeClass:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      borderClass: "border-l-amber-400",
      dotClass: "bg-amber-400",
      urgencyOrder: 3,
    };
  }

  const daysLeft = differenceInCalendarDays(dueDate, new Date());
  return {
    color: "neutral",
    label: `In ${daysLeft} days`,
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    borderClass: "border-l-slate-400",
    dotClass: "bg-slate-400",
    urgencyOrder: 4,
  };
}

export function formatFriendlyDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}
