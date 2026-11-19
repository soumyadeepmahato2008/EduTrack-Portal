"use client";

import React from "react";
import { SubjectItem, Role } from "@/types";
import { Plus, Tag } from "lucide-react";

interface SubjectFilterProps {
  subjects: SubjectItem[];
  selectedSubject: string | null;
  onSelectSubject: (subjectName: string | null) => void;
  currentRole: Role;
  onOpenAddSubject: () => void;
  assignmentCountsBySubject: Record<string, number>;
  totalAssignmentsCount: number;
}

export const SubjectFilter: React.FC<SubjectFilterProps> = ({
  subjects,
  selectedSubject,
  onSelectSubject,
  currentRole,
  onOpenAddSubject,
  assignmentCountsBySubject,
  totalAssignmentsCount,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
        <div className="flex items-center text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
          <Tag className="w-3.5 h-3.5 mr-1" />
          Filter:
        </div>

        {/* 'All' button */}
        <button
          onClick={() => onSelectSubject(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
            selectedSubject === null
              ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
          }`}
        >
          <span>All Subjects</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedSubject === null
                ? "bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {totalAssignmentsCount}
          </span>
        </button>

        {/* Dynamic Teacher-Added Subjects */}
        {subjects.map((sub) => {
          const count = assignmentCountsBySubject[sub.name] || 0;
          const isSelected = selectedSubject === sub.name;
          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubject(sub.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                  : "bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: sub.color || "#3b82f6" }}
              />
              <span>{sub.name}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? "bg-blue-700 text-blue-100"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Teacher Action: Add New Subject */}
      {currentRole === "teacher" && (
        <button
          onClick={onOpenAddSubject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors shrink-0"
          title="Add a new subject as teacher"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Subject</span>
        </button>
      )}
    </div>
  );
};
