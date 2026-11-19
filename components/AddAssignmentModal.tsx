"use client";

import React, { useState } from "react";
import { SubjectItem, Priority, TEACHER_SUBJECTS_LIST } from "@/types";
import { X, Calendar, BookOpen, AlertCircle, Sparkles, Check } from "lucide-react";
import { format, addDays, nextFriday } from "date-fns";

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectItem[];
  onAddAssignment: (assignmentData: {
    subject: string;
    title: string;
    dueDate: string;
    priority: Priority;
    description: string;
  }) => void;
  onOpenAddSubject: () => void;
}

export const AddAssignmentModal: React.FC<AddAssignmentModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onAddAssignment,
  onOpenAddSubject,
}) => {
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Merge the standard required subjects list with custom subjects
  const availableSubjectNames = Array.from(
    new Set([
      ...TEACHER_SUBJECTS_LIST,
      ...subjects.map((s) => s.name),
    ])
  );

  const [subject, setSubject] = useState(availableSubjectNames[0] || "Maths");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(tomorrowStr);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide an assignment name.");
      return;
    }
    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }

    onAddAssignment({
      subject,
      title: title.trim(),
      dueDate,
      priority,
      description: description.trim(),
    });

    setTitle("");
    setDescription("");
    setError("");
    onClose();
  };

  const setQuickDate = (type: "today" | "tomorrow" | "friday") => {
    const today = new Date();
    if (type === "today") setDueDate(format(today, "yyyy-MM-dd"));
    if (type === "tomorrow") setDueDate(format(addDays(today, 1), "yyyy-MM-dd"));
    if (type === "friday") setDueDate(format(nextFriday(today), "yyyy-MM-dd"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Assignment</h2>
              <p className="text-xs text-slate-500">Teacher task creation form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subject (Select Subject)
              </label>
              <button
                type="button"
                onClick={onOpenAddSubject}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Custom Subject
              </button>
            </div>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {availableSubjectNames.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 4 Exercises, Essay Draft"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Due Date & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickDate("today")}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate("tomorrow")}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate("friday")}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Friday
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Low", "Medium", "High"] as Priority[]).map((level) => {
                const isSelected = priority === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? level === "High"
                          ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          : level === "Medium"
                          ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Instructions / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Pages 140-145, submit through the classroom box."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all"
            >
              Publish Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
