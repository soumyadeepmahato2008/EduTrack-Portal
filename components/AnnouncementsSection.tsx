"use client";

import React, { useState } from "react";
import { AnnouncementItem, SubjectItem, Role } from "@/types";
import { Bell, Pin, Plus, Trash2, X, AlertCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface AnnouncementsSectionProps {
  announcements: AnnouncementItem[];
  subjects: SubjectItem[];
  currentRole: Role;
  onAddAnnouncement: (announcement: Omit<AnnouncementItem, "id" | "createdAt">) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({
  announcements,
  subjects,
  currentRole,
  onAddAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("General");
  const [isPinned, setIsPinned] = useState(false);
  const [author, setAuthor] = useState("Class Instructor");
  const [error, setError] = useState("");

  // Sort: Pinned first, then by date descending
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and announcement content.");
      return;
    }

    onAddAnnouncement({
      title: title.trim(),
      content: content.trim(),
      subject,
      isPinned,
      author: author.trim() || "Teacher",
    });

    setTitle("");
    setContent("");
    setIsPinned(false);
    setError("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-6 rounded-3xl border border-indigo-200/60 dark:border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Bell className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Classroom Announcements & Bulletins
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {currentRole === "teacher"
              ? "Broadcast critical notices, office hour alerts, and subject-specific instructions to your students."
              : "Stay informed about urgent schedules, room shifts, and reminders directly from your teachers."}
          </p>
        </div>

        {currentRole === "teacher" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      {sortedAnnouncements.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No announcements posted yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {currentRole === "teacher"
              ? "Click 'Post Announcement' to send the first bulletin."
              : "Check back later for class updates."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAnnouncements.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.isPinned
                  ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 shadow-sm"
                  : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                      <Pin className="w-3 h-3 fill-indigo-600" />
                      Pinned Notice
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {item.subject}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{item.createdAt}</span>
                  {currentRole === "teacher" && (
                    <button
                      onClick={() => onDeleteAnnouncement(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-3">
                {item.content}
              </p>

              <div className="text-[11px] text-slate-400 font-medium">
                Posted by: <span className="text-slate-600 dark:text-slate-300">{item.author}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Post New Announcement
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Target Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="General">General / All Classes</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Instructor Name
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lab Session Rescheduled to Thursday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Message / Bulletin Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide all relevant details, links, or instructions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinNotice" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pin this announcement to the top of the feed
                </label>
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
