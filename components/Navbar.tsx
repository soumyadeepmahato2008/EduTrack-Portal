"use client";

import React from "react";
import { Role, UserProfile } from "@/types";
import { GraduationCap, BookOpen, Bell, Calendar, Lock, User, LogOut } from "lucide-react";

interface NavbarProps {
  user: UserProfile;
  activeTab: "assignments" | "tests" | "announcements";
  onTabChange: (tab: "assignments" | "tests" | "announcements") => void;
  onOpenProfile: () => void;
  counts: {
    pendingAssignments: number;
    completedAssignments: number;
    testsCount: number;
    announcementsCount: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onOpenProfile,
  counts,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                EduTrack Hub
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Academic Task & Classroom Portal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              onClick={() => onTabChange("assignments")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "assignments"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Assignments</span>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-semibold">
                {counts.pendingAssignments}
              </span>
            </button>

            <button
              onClick={() => onTabChange("tests")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "tests"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Tests</span>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 font-semibold">
                {counts.testsCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange("announcements")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "announcements"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Announcements</span>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold">
                {counts.announcementsCount}
              </span>
            </button>
          </nav>

          {/* User Profile & Permanent Role Badge */}
          <div className="flex items-center space-x-3">
            {/* Permanent Role Indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                user.role === "teacher"
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              }`}
              title="Your role is permanent and cannot be modified."
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.role === "teacher" ? "Faculty Teacher" : "Enrolled Student"}</span>
            </div>

            {/* Profile Avatar Trigger */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-left"
              title="View and edit profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-white dark:border-slate-900 shadow-sm">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => onTabChange("assignments")}
            className={`flex items-center space-x-1 py-1 px-2.5 rounded-md ${
              activeTab === "assignments"
                ? "text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/60"
                : "text-slate-500"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Assignments ({counts.pendingAssignments})</span>
          </button>
          <button
            onClick={() => onTabChange("tests")}
            className={`flex items-center space-x-1 py-1 px-2.5 rounded-md ${
              activeTab === "tests"
                ? "text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/60"
                : "text-slate-500"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tests ({counts.testsCount})</span>
          </button>
          <button
            onClick={() => onTabChange("announcements")}
            className={`flex items-center space-x-1 py-1 px-2.5 rounded-md ${
              activeTab === "announcements"
                ? "text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/60"
                : "text-slate-500"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notices ({counts.announcementsCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
