import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";

export const isEmailConfigured =
  GMAIL_USER.length > 0 && GMAIL_APP_PASSWORD.length > 0;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char);
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  if (!isEmailConfigured) throw new Error("EMAIL_NOT_CONFIGURED");
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"EduTrack Hub" <${GMAIL_USER}>`,
    to: toEmail,
    subject: `🎓 EduTrack – Your Login OTP Code`,
    text: `Your EduTrack login verification code is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px 32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">🎓 EduTrack Hub</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Academic Task & Classroom Portal</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a;font-weight:700;">Verify Your Gmail Account</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">
        You requested to sign in to EduTrack. Use the OTP below. Valid for <strong>10 minutes</strong>.
      </p>
      <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;color:#3b82f6;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Your One-Time Password</p>
        <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1d4ed8;font-family:'Courier New',monospace;">${otp}</div>
        <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">⏱ Expires in 10 minutes</p>
      </div>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:24px;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:12px;color:#92400e;"><strong>⚠️ Security:</strong> Never share this OTP. EduTrack will never ask for it.</p>
      </div>
      <p style="margin:0;font-size:12px;color:#94a3b8;">If you did not request this, ignore this email.</p>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">© 2026 EduTrack Hub • Sent to ${escapeHtml(toEmail)}</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendTeacherIdEmail(
  toEmail: string,
  teacherName: string,
  teacherId: string
): Promise<void> {
  if (!isEmailConfigured) throw new Error("EMAIL_NOT_CONFIGURED");
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"EduTrack Hub" <${GMAIL_USER}>`,
    to: toEmail,
    subject: `🏫 EduTrack – Your Official Unique Teacher ID: ${teacherId}`,
    text: `Dear ${teacherName},\n\nYour Unique Teacher ID is: ${teacherId}\n\nEnter this in the EduTrack app to activate your faculty account.`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">🏫 EduTrack Hub</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Faculty Verification System</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a;font-weight:700;">Welcome, ${escapeHtml(teacherName)}! 👋</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">
        Your teacher profile has been created. Here is your <strong>Unique Teacher ID</strong> to activate your faculty account.
      </p>
      <div style="background:#f5f3ff;border:2px dashed #a78bfa;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;color:#7c3aed;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Your Unique Teacher ID</p>
        <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#4f46e5;font-family:'Courier New',monospace;">${escapeHtml(teacherId)}</div>
        <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">Enter this in the EduTrack Teacher Verification dialog</p>
      </div>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:24px;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:12px;color:#92400e;"><strong>⚠️ Important:</strong> This grants full faculty privileges. Keep it confidential.</p>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">© 2026 EduTrack Hub • Sent to ${escapeHtml(toEmail)}</p>
    </div>
  </div>
</body>
</html>`,
  });
}
