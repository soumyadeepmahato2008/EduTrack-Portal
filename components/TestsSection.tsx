"use client";

import React, { useState } from "react";
import { TestItem, SubjectItem, Role, TEACHER_SUBJECTS_LIST } from "@/types";
import { Calendar, Clock, Award, BookOpen, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { format, parseISO, differenceInDays, isPast } from "date-fns";

interface TestsSectionProps {
  tests: TestItem[];
  subjects: SubjectItem[];
  currentRole: Role;
  onAddTest: (test: Omit<TestItem, "id">) => void;
  onDeleteTest: (testId: string) => void;
}

export const TestsSection: React.FC<TestsSectionProps> = ({
  tests,
  subjects,
  currentRole,
  onAddTest,
  onDeleteTest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableSubjects = Array.from(
    new Set([...TEACHER_SUBJECTS_LIST, ...subjects.map((s) => s.name)])
  );

  const [subject, setSubject] = useState(availableSubjects[0] || "Maths");
  const [title, setTitle] = useState("");
  const [testDate, setTestDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxMarks, setMaxMarks] = useState(100);
  const [syllabus, setSyllabus] = useState("");
  const [error, setError] = useState("");

  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
  );

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !testDate || !syllabus.trim()) {
      setError("Please fill in all required test fields.");
      return;
    }

    onAddTest({
      subject,
      title: title.trim(),
      testDate,
      durationMinutes: Number(durationMinutes),
      maxMarks: Number(maxMarks),
      syllabus: syllabus.trim(),
    });

    setTitle("");
    setSyllabus("");
    setError("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-6 rounded-3xl border border-amber-200/60 dark:border-amber-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Scheduled Tests & Examinations
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {currentRole === "teacher"
              ? "You can schedule upcoming midterms, unit quizzes, and exam syllabuses for your classes."
              : "Review upcoming subject tests, syllabus scope, and prepare your revision schedule."}
          </p>
        </div>

        {currentRole === "teacher" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Test</span>
          </button>
        )}
      </div>

      {/* Tests Grid */}
      {sortedTests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No tests scheduled currently
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {currentRole === "teacher"
              ? "Click 'Schedule New Test' above to add an assessment."
              : "Your teachers haven't posted any upcoming assessments yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedTests.map((test) => {
            const dateObj = parseISO(test.testDate);
            const daysRemaining = differenceInDays(dateObj, new Date());
            const hasPassed = isPast(dateObj);

            return (
              <div
                key={test.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {test.subject}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        hasPassed
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : daysRemaining <= 3
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse dark:bg-rose-950/40"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40"
                      }`}
                    >
                      {hasPassed
                        ? "Completed"
                        : daysRemaining === 0
                        ? "Today!"
                        : daysRemaining === 1
                        ? "Tomorrow"
                        : `In ${daysRemaining} days`}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                    {test.title}
                  </h3>

                  {/* Syllabus Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 mb-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                      Syllabus:
                    </span>
                    <p className="line-clamp-3">{test.syllabus}</p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{format(dateObj, "MMM d, yyyy • h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{test.durationMinutes} mins</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Award className="w-3 h-3" />
                        {test.maxMarks} Marks
                      </span>
                    </div>
                  </div>

                  {currentRole === "teacher" && (
                    <button
                      onClick={() => onDeleteTest(test.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Delete Test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Schedule New Assessment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Test Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mid-Term Examination, Unit 3 Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Max Marks / Points
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Syllabus & Topics Covered
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="List chapters, sections, formulas, and references..."
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  Publish Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
