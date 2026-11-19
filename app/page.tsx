"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Assignment,
  SubjectItem,
  TestItem,
  AnnouncementItem,
  Role,
  Priority,
  UserProfile,
} from "@/types";
import {
  loadInitialData,
  saveToStorage,
  updateUserProfile,
  signOutUser,
  STORAGE_KEYS,
} from "@/lib/store";
import { getAssignmentStatus } from "@/lib/dateUtils";
import { Navbar } from "@/components/Navbar";
import { SubjectFilter } from "@/components/SubjectFilter";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AddAssignmentModal } from "@/components/AddAssignmentModal";
import { AddSubjectModal } from "@/components/AddSubjectModal";
import { TestsSection } from "@/components/TestsSection";
import { AnnouncementsSection } from "@/components/AnnouncementsSection";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Filter,
  Check,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [activeTab, setActiveTab] = useState<"assignments" | "tests" | "announcements">("assignments");
  const [assignmentSubTab, setAssignmentSubTab] = useState<"active" | "completed">("active");

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Authentication check & initial load
  useEffect(() => {
    const loadAuthenticatedDashboard = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) { router.replace("/login"); return; }
        const session = await response.json();
        const data = loadInitialData();
        if (!data.user || !data.user.isRoleLocked || data.user.email.toLowerCase() !== session.email || data.user.role !== session.role) {
          router.replace(session.role === "pending" ? "/onboarding" : "/login");
          return;
        }
        setUser(data.user);
        setSubjects(data.subjects);
        setAssignments(data.assignments);
        setTests(data.tests);
        setAnnouncements(data.announcements);
        setIsClient(true);
      } catch {
        router.replace("/login");
      }
    };
    void loadAuthenticatedDashboard();
  }, [router]);

  // Handle Profile Update
  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    const updated = updateUserProfile(updates);
    if (updated) {
      setUser(updated);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally {
      signOutUser();
      router.push("/login");
    }
  };

  // Add Assignment
  const handleAddAssignment = (newAsg: {
    subject: string;
    title: string;
    dueDate: string;
    priority: Priority;
    description: string;
  }) => {
    const created: Assignment = {
      id: `asg-${Date.now()}`,
      subject: newAsg.subject,
      title: newAsg.title,
      dueDate: newAsg.dueDate,
      priority: newAsg.priority,
      description: newAsg.description || undefined,
      isCompleted: false,
      createdByName: user?.fullName || "Instructor",
    };

    const updated = [created, ...assignments];
    setAssignments(updated);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, updated);
  };

  // Delete Assignment
  const handleDeleteAssignment = (id: string) => {
    const updated = assignments.filter((a) => a.id !== id);
    setAssignments(updated);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, updated);
  };

  // Toggle 'Mark as Done'
  const handleToggleComplete = (id: string) => {
    const updated = assignments.map((a) => {
      if (a.id === id) {
        const nextState = !a.isCompleted;
        return {
          ...a,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
        };
      }
      return a;
    });
    setAssignments(updated);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, updated);
  };

  // Add Subject (Teacher)
  const handleAddSubject = (newSubject: { name: string; code?: string; color: string }) => {
    const subjectItem: SubjectItem = {
      id: `sub-${Date.now()}`,
      name: newSubject.name,
      code: newSubject.code,
      color: newSubject.color,
    };
    const updated = [...subjects, subjectItem];
    setSubjects(updated);
    saveToStorage(STORAGE_KEYS.SUBJECTS, updated);
  };

  // Add Test (Teacher)
  const handleAddTest = (newTest: Omit<TestItem, "id">) => {
    const created: TestItem = {
      id: `test-${Date.now()}`,
      ...newTest,
    };
    const updated = [...tests, created];
    setTests(updated);
    saveToStorage(STORAGE_KEYS.TESTS, updated);
  };

  // Delete Test (Teacher)
  const handleDeleteTest = (id: string) => {
    const updated = tests.filter((t) => t.id !== id);
    setTests(updated);
    saveToStorage(STORAGE_KEYS.TESTS, updated);
  };

  // Add Announcement (Teacher)
  const handleAddAnnouncement = (newAnn: Omit<AnnouncementItem, "id" | "createdAt">) => {
    const now = new Date();
    const created: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      ...newAnn,
      createdAt: now.toISOString().replace("T", " ").substring(0, 16),
      author: user?.fullName || newAnn.author,
    };
    const updated = [created, ...announcements];
    setAnnouncements(updated);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  };

  // Delete Announcement (Teacher)
  const handleDeleteAnnouncement = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  };

  // Filtered and Sorted Assignments
  const { activeAssignments, completedAssignments, stats, countsBySubject } = useMemo(() => {
    let dueTodayCount = 0;
    let dueThisWeekCount = 0;
    let completedCount = 0;
    const subjectCounts: Record<string, number> = {};

    assignments.forEach((asg) => {
      subjectCounts[asg.subject] = (subjectCounts[asg.subject] || 0) + 1;

      if (asg.isCompleted) {
        completedCount++;
      } else {
        const status = getAssignmentStatus(asg.dueDate, false);
        if (status.color === "red") dueTodayCount++;
        else if (status.color === "yellow") dueThisWeekCount++;
      }
    });

    const filtered = selectedSubject
      ? assignments.filter((a) => a.subject.toLowerCase() === selectedSubject.toLowerCase())
      : assignments;

    const active = filtered
      .filter((a) => !a.isCompleted)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const completed = filtered
      .filter((a) => a.isCompleted)
      .sort((a, b) => new Date(b.completedAt || b.dueDate).getTime() - new Date(a.completedAt || a.dueDate).getTime());

    return {
      activeAssignments: active,
      completedAssignments: completed,
      stats: {
        total: assignments.length,
        dueToday: dueTodayCount,
        dueThisWeek: dueThisWeekCount,
        completed: completedCount,
      },
      countsBySubject: subjectCounts,
    };
  }, [assignments, selectedSubject]);

  if (!isClient || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const role = user.role;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0c111d] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProfile={() => setIsProfileDrawerOpen(true)}
        counts={{
          pendingAssignments: stats.total - stats.completed,
          completedAssignments: stats.completed,
          testsCount: tests.length,
          announcementsCount: announcements.length,
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Banner / Context */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 ${
                role === "teacher" ? "bg-indigo-600" : "bg-emerald-600"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {role === "teacher" ? "FACULTY TEACHER" : "STUDENT PORTAL"}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {role === "teacher"
                ? `Logged in as ${user.fullName} (${user.teacherSubjects?.join(", ") || "Faculty"}). Teacher ID: ${user.teacherId || "Verified"}.`
                : `Logged in as ${user.fullName} (${user.studentClass || "Student"}${user.studentStream ? ` - ${user.studentStream}` : ""}). Track deadlines, filter subjects, and click 'Mark as Done'.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileDrawerOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>

        {/* TAB 1: ASSIGNMENTS DASHBOARD */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Active Tasks</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {stats.total - stats.completed}
                  </p>
                </div>
              </div>

              {/* Red Indicator Stat: Due Today */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Due Today</p>
                  </div>
                  <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                    {stats.dueToday}
                  </p>
                </div>
              </div>

              {/* Yellow Indicator Stat: Due This Week */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Due This Week</p>
                  </div>
                  <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                    {stats.dueThisWeek}
                  </p>
                </div>
              </div>

              {/* Green Indicator Stat: Completed */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed</p>
                  </div>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stats.completed}
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              {/* Sub-Tabs: Active vs Completed */}
              <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl w-fit">
                <button
                  onClick={() => setAssignmentSubTab("active")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    assignmentSubTab === "active"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Active Assignments ({activeAssignments.length})
                </button>
                <button
                  onClick={() => setAssignmentSubTab("completed")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    assignmentSubTab === "completed"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Completed Tab ({completedAssignments.length})</span>
                </button>
              </div>

              {/* Add Assignment Button (Teacher only) */}
              {role === "teacher" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddAssignmentOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Assignment</span>
                  </button>
                </div>
              )}
            </div>

            {/* Subject Filter Bar */}
            <SubjectFilter
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
              currentRole={role}
              onOpenAddSubject={() => setIsAddSubjectOpen(true)}
              assignmentCountsBySubject={countsBySubject}
              totalAssignmentsCount={assignments.length}
            />

            {/* Cards Grid sorted by nearest due date */}
            {assignmentSubTab === "active" ? (
              activeAssignments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    All caught up!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {selectedSubject
                      ? `No pending assignments for ${selectedSubject}. Try clearing the subject filter.`
                      : "There are no pending assignments remaining on your dashboard."}
                  </p>
                  {selectedSubject && (
                    <button
                      onClick={() => setSelectedSubject(null)}
                      className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 rounded-xl hover:bg-blue-100"
                    >
                      Clear Subject Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      currentRole={role}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteAssignment}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Completed Tab View */
              completedAssignments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No completed assignments yet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Click the checkmark button on any active card to mark it as done.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {completedAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      currentRole={role}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteAssignment}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 2: TESTS & EXAMS */}
        {activeTab === "tests" && (
          <TestsSection
            tests={tests}
            subjects={subjects}
            currentRole={role}
            onAddTest={handleAddTest}
            onDeleteTest={handleDeleteTest}
          />
        )}

        {/* TAB 3: ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <AnnouncementsSection
            announcements={announcements}
            subjects={subjects}
            currentRole={role}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      {role === "teacher" && (
        <>
          <AddAssignmentModal
            isOpen={isAddAssignmentOpen}
            onClose={() => setIsAddAssignmentOpen(false)}
            subjects={subjects}
            onAddAssignment={handleAddAssignment}
            onOpenAddSubject={() => {
              setIsAddAssignmentOpen(false);
              setIsAddSubjectOpen(true);
            }}
          />

          <AddSubjectModal
            isOpen={isAddSubjectOpen}
            onClose={() => setIsAddSubjectOpen(false)}
            onAddSubject={handleAddSubject}
          />
        </>
      )}

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        user={user}
        onUpdateUser={handleUpdateProfile}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
