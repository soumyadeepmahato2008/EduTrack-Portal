// Retained as a shared UI type for the legacy notification banner.
// Authentication codes are generated and verified only by server API routes.
export interface SentEmailNotification {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  code?: string;
  type: 'otp' | 'teacher_id';
  timestamp: number;
}
