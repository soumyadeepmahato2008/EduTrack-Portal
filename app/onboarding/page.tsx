"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Role,
  UserProfile,
  StudentClass,
  SeniorStream,
  ScienceOption,
  TEACHER_SUBJECTS_LIST,
} from "@/types";
import { getCurrentUser, setCurrentUser, STORAGE_KEYS } from "@/lib/store";
import {
  GraduationCap,
  Shield,
  UserCheck,
  AlertTriangle,
  Lock,
  CheckCircle2,
  BookOpen,
  Check,
  Mail,
  KeyRound,
  X,
  Info,
  Loader2,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [googleAuth, setGoogleAuth] = useState<{
    email: string;
    fullName: string;
    avatarUrl?: string;
  } | null>(null);

  // Common Fields
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [fullName, setFullName] = useState("");
  const [hasAcknowledgedLock, setHasAcknowledgedLock] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Specific Fields
  const [studentClass, setStudentClass] = useState<StudentClass>("Class 6");
  const [studentStream, setStudentStream] = useState<SeniorStream>("Science");
  const [scienceOption, setScienceOption] = useState<ScienceOption>("PCM");
  const [studentId, setStudentId] = useState("");

  // Teacher Specific Fields
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Maths"]);

  // Teacher Unique ID Verification Popup State
  const [showTeacherIdModal, setShowTeacherIdModal] = useState(false);
  const [generatedTeacherId, setGeneratedTeacherId] = useState("");
  const [enteredTeacherId, setEnteredTeacherId] = useState("");
  const [teacherIdError, setTeacherIdError] = useState("");
  const [teacherAccessCode, setTeacherAccessCode] = useState("");
  const [lockedRole, setLockedRole] = useState<Role | null>(null);
  const [isVerifyingTeacherId, setIsVerifyingTeacherId] = useState(false);

  // Dev mode: shown when SMTP not configured
  const [devModeTeacherId, setDevModeTeacherId] = useState<string | null>(null);

  useEffect(() => {
    // Browser storage is display data only; the signed server cookie proves identity.
    const loadVerifiedSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) { router.push("/login"); return; }
        const session = await response.json();
        if (!["pending", "student", "teacher"].includes(session.role)) { router.push("/login"); return; }
        const existing = getCurrentUser();
        if (existing?.isRoleLocked && existing.email.toLowerCase() === session.email && existing.role === session.role) { router.push("/"); return; }
        if (session.role === "student" || session.role === "teacher") {
          setLockedRole(session.role);
          setSelectedRole(session.role);
        }
        const tempAuthStr = localStorage.getItem(STORAGE_KEYS.GOOGLE_TEMP_AUTH);
        if (!tempAuthStr) { router.push("/login"); return; }
        const parsed = JSON.parse(tempAuthStr);
        if (parsed.email?.toLowerCase() !== session.email) { router.push("/login"); return; }
        setGoogleAuth({ ...parsed, email: session.email });
        setFullName(parsed.fullName || "");
      } catch {
        router.push("/login");
      }
    };
    void loadVerifiedSession();
  }, [router]);

  // Check if senior class (11 or 12)
  const isSeniorClass = studentClass === "Class 11" || studentClass === "Class 12";

  // Toggle teacher subject selection
  const toggleTeacherSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length === 1) return; // Keep at least one subject
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }

    if (!hasAcknowledgedLock) {
      setError("Please acknowledge that your role selection is permanent and cannot be undone.");
      return;
    }

    // STUDENT SUBMISSION FLOW
    if (selectedRole === "student") {
      if (!studentId.trim()) {
        setError("Please enter your Student Roll Number or ID.");
        return;
      }

      const newStudentProfile: UserProfile = {
        id: `usr_stu_${Date.now()}`,
        email: googleAuth?.email || "student@gmail.com",
        fullName: fullName.trim(),
        avatarUrl:
          googleAuth?.avatarUrl ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`,
        role: "student",
        isRoleLocked: true,
        studentClass,
        studentStream: isSeniorClass ? studentStream : undefined,
        scienceStreamOption:
          isSeniorClass && studentStream === "Science" ? scienceOption : undefined,
        studentId: studentId.trim(),
        createdAt: new Date().toISOString(),
      };

      setIsSubmitting(true);
      try {
        const sessionResponse = await fetch("/api/auth/complete-student", { method: "POST" });
        const sessionData = await sessionResponse.json();
        if (!sessionResponse.ok || !sessionData.success) {
          setError(sessionData.error || "Your verified session has expired. Please sign in again.");
          setIsSubmitting(false);
          return;
        }
        setCurrentUser(newStudentProfile);
        localStorage.removeItem(STORAGE_KEYS.GOOGLE_TEMP_AUTH);
        router.push("/");
      } catch {
        setError("Unable to complete secure sign-in. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // TEACHER SUBMISSION FLOW: Call server API to generate and email Teacher ID
    if (selectedRole === "teacher") {
      if (selectedSubjects.length === 0) {
        setError("Please select at least one subject you teach.");
        return;
      }
      if (lockedRole === "teacher") {
        const newTeacherProfile: UserProfile = {
          id: `usr_tch_${Date.now()}`, email: googleAuth?.email || "teacher@gmail.com", fullName: fullName.trim(),
          avatarUrl: googleAuth?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`,
          role: "teacher", isRoleLocked: true, teacherSubjects: selectedSubjects, teacherId: "Verified", createdAt: new Date().toISOString(),
        };
        setCurrentUser(newTeacherProfile);
        localStorage.removeItem(STORAGE_KEYS.GOOGLE_TEMP_AUTH);
        router.push("/");
        return;
      }
      if (!teacherAccessCode.trim()) {
        setError("An institution-issued teacher registration code is required.");
        return;
      }

      setIsSubmitting(true);
      try {
        const email = googleAuth?.email || "teacher@gmail.com";
        const res = await fetch("/api/auth/send-teacher-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherName: fullName.trim(), registrationCode: teacherAccessCode.trim() }),
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Failed to generate Teacher ID. Please try again.");
          return;
        }

        // Dev mode: show generated teacher ID on-screen
        if (data.devMode && data.devTeacherId) {
          setDevModeTeacherId(data.devTeacherId);
          setGeneratedTeacherId(data.devTeacherId); // store locally for display only; server verifies
        } else {
          setDevModeTeacherId(null);
        }

        setShowTeacherIdModal(true);
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Verify and Confirm Unique Teacher ID via server API
  const handleConfirmTeacherId = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherIdError("");

    if (!enteredTeacherId.trim()) {
      setTeacherIdError("Please enter the Unique Teacher ID received in your Gmail account.");
      return;
    }

    setIsVerifyingTeacherId(true);
    try {
      const email = googleAuth?.email || "teacher@gmail.com";
      const res = await fetch("/api/auth/verify-teacher-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, teacherId: enteredTeacherId.trim() }),
      });
      const data = await res.json();

      if (!data.success) {
        setTeacherIdError(
          data.error || "Invalid Teacher ID. Please check your Gmail inbox and try again."
        );
        setIsVerifyingTeacherId(false);
        return;
      }

      // Verification passed — create teacher profile
      const confirmedTeacherId = data.teacherId || enteredTeacherId.trim().toUpperCase();

      const newTeacherProfile: UserProfile = {
        id: `usr_tch_${Date.now()}`,
        email: googleAuth?.email || "teacher@gmail.com",
        fullName: fullName.trim(),
        avatarUrl:
          googleAuth?.avatarUrl ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`,
        role: "teacher",
        isRoleLocked: true,
        teacherSubjects: selectedSubjects,
        teacherId: confirmedTeacherId,
        createdAt: new Date().toISOString(),
      };

      setTimeout(() => {
        setCurrentUser(newTeacherProfile);
        localStorage.removeItem(STORAGE_KEYS.GOOGLE_TEMP_AUTH);
        setShowTeacherIdModal(false);
        router.push("/");
      }, 500);
    } catch {
      setTeacherIdError("Network error during verification. Please try again.");
      setIsVerifyingTeacherId(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 via-slate-100/60 to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Create Academic Profile
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Authenticated via:{" "}
            <span className="font-semibold text-blue-600">{googleAuth?.email}</span>
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Permanent Role Selection */}
            {lockedRole ? (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                Permanent account role: {lockedRole === "teacher" ? "Teacher" : "Student"}. This role is verified by the server and cannot be changed.
              </div>
            ) : <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Select Your Permanent Role
                </label>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                  Cannot be undone
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("student")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    selectedRole === "student"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    {selectedRole === "student" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">I am a Student</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Classes 6 to 12. Track assignments and mark as completed.
                  </p>
                </button>

                {/* Teacher Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("teacher")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    selectedRole === "teacher"
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl">
                      <Shield className="w-5 h-5" />
                    </div>
                    {selectedRole === "teacher" && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">I am a Teacher</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Unique Teacher ID will be emailed to your Gmail for verification.
                  </p>
                </button>
              </div>
            </div>}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priyanshu Roy"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ---------------- STUDENT SECTION (Classes 6 to 12) ---------------- */}
            {selectedRole === "student" && (
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Student Academic Enrollment</span>
                </div>

                {/* Class Selection: Classes from 6 to 12 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Your Class (Class 6 to Class 12)
                  </label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value as StudentClass)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11 (Senior Secondary)</option>
                    <option value="Class 12">Class 12 (Senior Secondary)</option>
                  </select>
                </div>

                {/* Stream Choice: Displayed only if Class 11 or 12 */}
                {isSeniorClass && (
                  <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1.5">
                        Senior Stream Selection (Class 11 & 12)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Humanities", "Commerce", "Science"] as SeniorStream[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStudentStream(st)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                              studentStream === st
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Science Stream Option: Displayed only if Science is chosen */}
                    {studentStream === "Science" && (
                      <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 animate-in fade-in duration-150">
                        <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1.5">
                          Science Stream Subject Group
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["PCMB", "PCB", "PCM"] as ScienceOption[]).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setScienceOption(opt)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                                scienceOption === opt
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1.5">
                          {scienceOption === "PCMB" && "Physics, Chemistry, Maths, Biology"}
                          {scienceOption === "PCB" && "Physics, Chemistry, Biology (Medical track)"}
                          {scienceOption === "PCM" && "Physics, Chemistry, Maths (Engineering track)"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Roll Number / Student ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Roll Number / Enrollment ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-ROLL-42"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
            )}

            {/* ---------------- TEACHER SECTION (Specified Subjects) ---------------- */}
            {selectedRole === "teacher" && (
              <div className="space-y-4 p-5 bg-indigo-50/40 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Teacher Subjects (Select subjects you teach)</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold">Multiple allowed</span>
                </div>

                {/* Subjects: Maths, Science, Social Science, English, Hindi, Sanskrit, Physics, Chemistry, Biology */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TEACHER_SUBJECTS_LIST.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleTeacherSubject(subject)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                        }`}
                      >
                        <span>{subject}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {!lockedRole && <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Institution-issued Teacher Registration Code
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={teacherAccessCode}
                    onChange={(event) => setTeacherAccessCode(event.target.value)}
                    placeholder="Enter the code provided by your institution"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">This code is checked by the server and is never stored in your browser profile.</p>
                </div>}

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Unique Teacher ID Verification:
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your unique employee ID will be automatically generated and dispatched to{" "}
                    <strong>{googleAuth?.email}</strong> upon confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* Permanent Role Agreement */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Irreversible Role Selection Confirmation</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                You are setting your account as a{" "}
                <strong>{selectedRole === "teacher" ? "Faculty Teacher" : "Enrolled Student"}</strong>. This
                selection is permanent and cannot be undone later.
              </p>
              <div className="pt-1.5 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="lockAgreement"
                  checked={hasAcknowledgedLock}
                  onChange={(e) => setHasAcknowledgedLock(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="lockAgreement"
                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  I confirm that my role selection is final and cannot be modified.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Teacher ID to Gmail...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {selectedRole === "teacher"
                      ? "Confirm Profile & Send Unique Teacher ID"
                      : "Confirm & Complete Student Registration"}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ---------------- TEACHER UNIQUE ID EMAIL POPUP MODAL ---------------- */}
      {showTeacherIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Unique Teacher ID Verification
                </h3>
              </div>
              <button
                onClick={() => setShowTeacherIdModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Popup message as requested */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800 text-xs space-y-2">
              <p className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                Unique Teacher ID has been shared to your Gmail account!
              </p>
              <p className="text-indigo-800/90 dark:text-indigo-300 leading-relaxed text-[11px]">
                Please check your email (
                <span className="font-semibold">{googleAuth?.email}</span>) and enter the Unique Teachers ID
                below to activate your account.
              </p>
            </div>

            {/* Dev Mode Banner inside modal */}
            {devModeTeacherId && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  Development Mode — SMTP not configured
                </div>
                <p>
                  Your Teacher ID is:{" "}
                  <span className="font-mono font-black text-sm text-amber-900 tracking-widest">
                    {devModeTeacherId}
                  </span>
                </p>
                <p className="text-[11px] text-amber-700">
                  Add <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> to{" "}
                  <code>.env.local</code> to send real emails.
                </p>
              </div>
            )}

            {teacherIdError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{teacherIdError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmTeacherId} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter Unique Teachers ID
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. TCH-849201"
                  value={enteredTeacherId}
                  onChange={(e) => setEnteredTeacherId(e.target.value)}
                  className="w-full text-center tracking-wider text-base font-bold font-mono py-3 rounded-2xl border-2 border-indigo-500/60 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingTeacherId}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isVerifyingTeacherId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Activate Teacher Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
