# EduTrack - Classroom Assignment & Assessment Hub

An academic task, examination, and announcement management portal built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 🌟 Key Features

### 1. Assignment Management
- **Add Assignment Form**: Subject (Math, Science, History, English, or custom), Assignment Name, Due Date, and Priority (Low, Medium, High).
- **Cards Sorted by Due Date**: Automatically prioritized and ordered with the nearest deadlines first.
- **Dynamic Color Indicators**:
  - 🔴 **Red**: Due today (or overdue).
  - 🟡 **Yellow**: Due this week.
  - 🟢 **Green**: Completed.
- **One-Click "Mark as Done"**: Click the checkmark to instantly move cards between the "Active" and "Completed" tabs.
- **Subject Filter Bar**: Quick filter pill buttons populated by teacher-created subjects showing live counts.

### 2. Tests & Examination Schedule
- **Updated by Teachers**: Add assessments with Date/Time, Duration, Max Marks, and detailed Syllabus.
- **Real-time Urgency**: Badges indicating "Today", "Tomorrow", or countdown days.

### 3. Classroom Announcements
- **Broadcast Bulletins**: Teachers publish announcements with priority pinned flags, subject tags, and timestamps.
- **Pinned Notices**: Key bulletins remain stickied to the top of the feed.

### 4. Dual Roles: Student & Teacher View
- **Student View**: Filter by subjects, view urgency-coded cards, click "Mark as Done", review test syllabuses and announcements.
- **Teacher View**: Full instructor privileges to publish assignments, schedule tests, post announcements, and create subjects.
- **Instant Role Switcher**: Quick toggle in the top bar for easy demonstration and testing.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 Integrations & Plugins

### 1. Clerk Authentication
- Configured in `.env.example`
- Supports student and teacher user metadata.

### 2. Supabase PostgreSQL
- Run the schema in `supabase-schema.sql` via your Supabase SQL editor.
- Connect via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Postman API Suite
- Import `postman/EduTrack_API_Collection.json` into Postman to run end-to-end API tests against `/api/assignments`, `/api/subjects`, `/api/tests`, and `/api/announcements`.

### 4. Vercel Deployment
- Configured with `vercel.json` for one-click deployment.


## Security configuration (required before production)

1. Copy `.env.example` to `.env.local` and set a unique `SESSION_SECRET` (at least 32 characters). Never commit `.env.local`.
2. Configure `GMAIL_USER` and `GMAIL_APP_PASSWORD` for OTP email delivery. Production refuses to return OTPs or teacher IDs in API responses when email is not configured.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must never be prefixed with `NEXT_PUBLIC_`.
4. Run the complete `supabase-schema.sql` against the Supabase project. This creates the challenge and permanent account-role tables and enables Row Level Security. Server API routes use the service-role key after checking the signed session and role.
5. Set `TEACHER_REGISTRATION_CODE` to a strong, institution-controlled secret of at least 32 characters. Without it, new teacher registration is disabled. Do not use a sample/default code.
6. Restart the Next.js server after changing environment variables.

### Authentication changes

- Email OTPs and teacher codes are generated with Node's cryptographic random generator and stored as hashes.
- Challenges expire after 10 minutes, allow at most five verification attempts, and have a 60-second resend cooldown per email and purpose. Persistent Supabase-backed rate limits also protect OTP sends, OTP verification and teacher registration by IP/account bucket.
- Production challenge and permanent role records are stored in Supabase; in-memory storage is development-only.
- Successful verification creates an eight-hour signed HttpOnly, SameSite=Lax session cookie (Secure in production).
- The server, not localStorage, decides whether a request is authenticated and whether the account has teacher privileges.
- Data API reads require a signed-in account; all create operations require the server-side teacher role.
- Teacher registration requires both the institution-issued registration code and the email-delivered teacher verification code.
- `.env.local`, build output and dependencies are excluded from the cleaned project archive.

### Important existing limitation

The dashboard's academic records and profile display fields still use browser localStorage in this project. These changes secure API authorization and account-role decisions, but do not migrate dashboard records or full profile details into Supabase.
