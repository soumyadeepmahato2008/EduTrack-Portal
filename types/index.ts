export type Priority = "Low" | "Medium" | "High";

export type Role = "student" | "teacher";

export type StudentClass =
  | "Class 6"
  | "Class 7"
  | "Class 8"
  | "Class 9"
  | "Class 10"
  | "Class 11"
  | "Class 12";

export type SeniorStream = "Humanities" | "Commerce" | "Science";

export type ScienceOption = "PCMB" | "PCB" | "PCM";

export const TEACHER_SUBJECTS_LIST = [
  "Maths",
  "Science",
  "Social Science",
  "English",
  "Hindi",
  "Sanskrit",
  "Physics",
  "Chemistry",
  "Biology",
] as const;

export type TeacherSubject = typeof TEACHER_SUBJECTS_LIST[number];

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  isRoleLocked: boolean;
  // Student specific fields
  studentClass?: StudentClass;
  studentStream?: SeniorStream;
  scienceStreamOption?: ScienceOption;
  studentId?: string;
  // Teacher specific fields
  teacherSubjects?: string[];
  teacherId?: string; // Unique verified Teacher ID
  createdAt: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  color?: string;
}

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  priority: Priority;
  description?: string;
  isCompleted?: boolean;
  completedAt?: string;
  createdByName?: string;
}

export interface TestItem {
  id: string;
  subject: string;
  title: string;
  testDate: string; // ISO string
  durationMinutes: number;
  maxMarks: number;
  syllabus: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  subject: string;
  isPinned: boolean;
  createdAt: string;
  author: string;
}
