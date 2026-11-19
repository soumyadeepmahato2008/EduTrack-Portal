"use client";

import { Assignment, SubjectItem, TestItem, AnnouncementItem, Role, UserProfile } from "@/types";
import { format, addDays } from "date-fns";

const todayStr = format(new Date(), "yyyy-MM-dd");
const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
const inThreeDaysStr = format(addDays(new Date(), 3), "yyyy-MM-dd");
const inSevenDaysStr = format(addDays(new Date(), 7), "yyyy-MM-dd");

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  { id: "sub-1", name: "Math", code: "MATH101", color: "#3b82f6" },
  { id: "sub-2", name: "Science", code: "SCI201", color: "#10b981" },
  { id: "sub-3", name: "History", code: "HIST102", color: "#f59e0b" },
  { id: "sub-4", name: "English", code: "ENG101", color: "#8b5cf6" },
];

export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    subject: "Math",
    title: "Chapter 4 Calculus Exercises",
    dueDate: todayStr,
    priority: "High",
    description: "Complete problems 1 through 25 on page 142. Show all step-by-step working.",
    isCompleted: false,
    createdByName: "Prof. Davis",
  },
  {
    id: "asg-2",
    subject: "Science",
    title: "Photosynthesis Lab Report Draft",
    dueDate: tomorrowStr,
    priority: "High",
    description: "Submit 2-page lab report draft with chlorophyll absorbance graphs and hypothesis conclusion.",
    isCompleted: false,
    createdByName: "Dr. Evelyn Reed",
  },
  {
    id: "asg-3",
    subject: "History",
    title: "World War II Primary Source Analysis",
    dueDate: inThreeDaysStr,
    priority: "Medium",
    description: "Read the diary excerpt from Winston Churchill and write a 500-word contextual analysis.",
    isCompleted: false,
    createdByName: "Mr. Thomas Clark",
  },
  {
    id: "asg-4",
    subject: "English",
    title: "Essay Draft: Great Expectations Theme",
    dueDate: inSevenDaysStr,
    priority: "Low",
    description: "First draft exploring social class commentary in Charles Dickens' Great Expectations.",
    isCompleted: false,
    createdByName: "Ms. Rachel Green",
  },
  {
    id: "asg-5",
    subject: "Math",
    title: "Quadratic Equations Problem Set",
    dueDate: todayStr,
    priority: "Medium",
    description: "Factoring practice worksheet handed out in Tuesday's lecture.",
    isCompleted: true,
    completedAt: new Date().toISOString(),
    createdByName: "Prof. Davis",
  },
];

export const DEFAULT_TESTS: TestItem[] = [
  {
    id: "test-1",
    subject: "Math",
    title: "Mid-Term Exam: Derivatives & Integrals",
    testDate: format(addDays(new Date(), 4), "yyyy-MM-dd'T'10:00"),
    durationMinutes: 90,
    maxMarks: 100,
    syllabus: "Chapters 1 to 4: Limits, Continuity, Chain Rule, Implicit Differentiation, and Applications.",
  },
  {
    id: "test-2",
    subject: "Science",
    title: "Cellular Biology Unit Assessment",
    testDate: format(addDays(new Date(), 8), "yyyy-MM-dd'T'14:00"),
    durationMinutes: 60,
    maxMarks: 50,
    syllabus: "Cell organelle functions, membrane transport mechanisms, and cellular respiration.",
  },
  {
    id: "test-3",
    subject: "History",
    title: "20th Century Geopolitics Pop Quiz",
    testDate: format(addDays(new Date(), 12), "yyyy-MM-dd'T'09:30"),
    durationMinutes: 45,
    maxMarks: 40,
    syllabus: "Post-WWI treaties, League of Nations, and the Great Depression economic impact.",
  },
];

export const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-1",
    title: "Math Tutorial Session & Doubt Clearing",
    content: "An extra doubt-clearing session for Chapter 4 will be held this Thursday at 4:00 PM in Room 302.",
    subject: "Math",
    isPinned: true,
    createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
    author: "Prof. Davis",
  },
  {
    id: "ann-2",
    title: "Science Lab Safety Equipment Reminder",
    content: "All students must bring their own certified safety goggles and lab coats for next Tuesday's experiment.",
    subject: "Science",
    isPinned: false,
    createdAt: format(addDays(new Date(), -1), "yyyy-MM-dd HH:mm"),
    author: "Dr. Evelyn Reed",
  },
  {
    id: "ann-3",
    title: "Library Extended Hours for Upcoming Exams",
    content: "The main academic library will remain open until 11:00 PM on weekdays throughout the testing period.",
    subject: "General",
    isPinned: true,
    createdAt: format(addDays(new Date(), -2), "yyyy-MM-dd HH:mm"),
    author: "Academic Office",
  },
];

// Local storage keys
const STORAGE_KEYS = {
  ASSIGNMENTS: "portal_assignments_v1",
  SUBJECTS: "portal_subjects_v1",
  TESTS: "portal_tests_v1",
  ANNOUNCEMENTS: "portal_announcements_v1",
  USER_PROFILE: "portal_user_profile_v1",
  GOOGLE_TEMP_AUTH: "portal_google_temp_auth_v1",
};

export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("Failed to read user profile", e);
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    }
  } catch (e) {
    console.error("Failed to save user profile", e);
  }
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
  const current = getCurrentUser();
  if (!current) return null;

  // Enforce role immutability: Role cannot be changed once set
  const updated: UserProfile = {
    ...current,
    ...updates,
    role: current.role, // role remains strictly locked
    isRoleLocked: true,
  };

  setCurrentUser(updated);
  return updated;
}

export function signOutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  localStorage.removeItem(STORAGE_KEYS.GOOGLE_TEMP_AUTH);
}

export function loadInitialData() {
  if (typeof window === "undefined") {
    return {
      assignments: DEFAULT_ASSIGNMENTS,
      subjects: DEFAULT_SUBJECTS,
      tests: DEFAULT_TESTS,
      announcements: DEFAULT_ANNOUNCEMENTS,
      user: null as UserProfile | null,
    };
  }

  try {
    const savedAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    const savedSubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    const savedTests = localStorage.getItem(STORAGE_KEYS.TESTS);
    const savedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    const savedUser = getCurrentUser();

    return {
      assignments: savedAssignments ? JSON.parse(savedAssignments) : DEFAULT_ASSIGNMENTS,
      subjects: savedSubjects ? JSON.parse(savedSubjects) : DEFAULT_SUBJECTS,
      tests: savedTests ? JSON.parse(savedTests) : DEFAULT_TESTS,
      announcements: savedAnnouncements ? JSON.parse(savedAnnouncements) : DEFAULT_ANNOUNCEMENTS,
      user: savedUser,
    };
  } catch (e) {
    console.error("Failed to load stored data", e);
    return {
      assignments: DEFAULT_ASSIGNMENTS,
      subjects: DEFAULT_SUBJECTS,
      tests: DEFAULT_TESTS,
      announcements: DEFAULT_ANNOUNCEMENTS,
      user: null,
    };
  }
}

export function saveToStorage(key: string, data: unknown) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }
}

export { STORAGE_KEYS };
