"use client";

import React from "react";
import { Assignment, Role } from "@/types";
import { getAssignmentStatus, formatFriendlyDate } from "@/lib/dateUtils";
import { Check, Calendar, AlertCircle, Trash2, ArrowUpRight, CheckCircle2, RotateCcw } from "lucide-react";

interface AssignmentCardProps {
  assignment: Assignment;
  currentRole: Role;
  onToggleComplete: (assignmentId: string) => void;
  onDelete?: (assignmentId: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  currentRole,
  onToggleComplete,
  onDelete,
}) => {
  const status = getAssignmentStatus(assignment.dueDate, assignment.isCompleted);

  // Priority badge styling
  const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
    High: {
      bg: "bg-red-50 dark:bg-red-950/40",
      text: "text-red-700 dark:text-red-400 font-semibold",
      border: "border-red-200 dark:border-red-800",
    },
    Medium: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400 font-semibold",
      border: "border-amber-200 dark:border-amber-800",
    },
    Low: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
  };

  const priorityStyle = priorityStyles[assignment.priority] || priorityStyles.Medium;

  return (
    <div
      className={`group relative bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-200 border-l-[6px] ${status.borderClass}`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {assignment.subject}
          </span>

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
          >
            {assignment.priority === "High" && <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" />}
            {assignment.priority} Priority
          </span>
        </div>

        {/* Urgency Status Indicator: Red (Today), Yellow (This Week), Green (Completed) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Assignment Title & Description */}
      <div className="mb-4">
        <h3
          className={`text-base font-bold text-slate-900 dark:text-white leading-snug ${
            assignment.isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""
          }`}
        >
          {assignment.title}
        </h3>
        {assignment.description && (
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {assignment.description}
          </p>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Due: </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatFriendlyDate(assignment.dueDate)}
          </span>
          {assignment.createdByName && (
            <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2">
              • By {assignment.createdByName}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Teacher Delete Control */}
          {currentRole === "teacher" && onDelete && (
            <button
              onClick={() => onDelete(assignment.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete assignment (Teacher action)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* One-Click 'Mark as Done' / 'Mark as Incomplete' Button */}
          <button
            onClick={() => onToggleComplete(assignment.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
              assignment.isCompleted
                ? "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-500/20"
            }`}
            title={assignment.isCompleted ? "Move back to pending" : "Mark as completed"}
          >
            {assignment.isCompleted ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Mark as Done</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
