"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types";
import { X, Lock, User, Mail, LogOut, Check, Save, BookOpen, ShieldCheck, Tag } from "lucide-react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onSignOut: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onSignOut,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      fullName: fullName.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Academic Profile
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Card */}
          <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-lg overflow-hidden border border-blue-200 dark:border-blue-800 shrink-0">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user.fullName.charAt(0)
              )}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                {user.fullName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Permanent Role: {user.role === "teacher" ? "Teacher" : "Student"}</span>
              </div>
            </div>
          </div>

          {/* Academic Details Section */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Academic Details
            </h3>

            {user.role === "student" ? (
              <div className="space-y-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-slate-500">Enrolled Class:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {user.studentClass || "Class 6"}
                  </span>
                </div>

                {user.studentStream && (
                  <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-slate-500">Senior Stream:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {user.studentStream}
                    </span>
                  </div>
                )}

                {user.scienceStreamOption && (
                  <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-slate-500">Subject Track:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {user.scienceStreamOption}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Student Roll No:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {user.studentId || "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-slate-500">Unique Teacher ID:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                    {user.teacherId || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1.5">Assigned Subjects:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.teacherSubjects?.map((sub) => (
                      <span
                        key={sub}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      >
                        {sub}
                      </span>
                    )) || <span className="text-slate-400">General</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Display Name</span>
            </button>
          </form>
        </div>

        {/* Footer / Sign Out */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <button
            onClick={onSignOut}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
