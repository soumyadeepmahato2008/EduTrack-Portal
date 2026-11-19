# EduTrack Portal — Security Repair Notes

## Implemented

- Replaced the old in-memory plaintext OTP flow with cryptographically generated six-digit codes and hashed challenge storage.
- Added ten-minute challenge expiry, five verification attempts, and a 60-second resend cooldown per email/purpose.
- Added persistent Supabase-backed rate limits for OTP sending, OTP verification, and teacher registration. Development-only memory fallbacks are used only outside production.
- Added signed server-side session cookies: HttpOnly, SameSite=Lax, eight-hour lifetime, and Secure in production.
- Added server-side session inspection and logout endpoints.
- Made the server's permanent account-role record authoritative. Student/teacher role is locked once and read again after later OTP logins.
- Required an institution-controlled registration secret (at least 32 characters) before a new teacher can request a teacher ID. The teacher ID is then verified against a server-side challenge.
- Protected academic API reads with authentication and create operations with the server-verified teacher role.
- Switched server Supabase access to the server-only service-role key and enabled RLS on project tables so the public anon key cannot directly read/write them.
- Added same-origin checks to authentication mutations and security response headers.
- Removed obsolete browser-side OTP/teacher-ID generation code.
- Escaped user-provided teacher names and email addresses in HTML email templates; removed OTP from the email subject.
- Added `.gitignore` rules and removed `.env.local`, `.next`, `node_modules`, and generated TypeScript build metadata from the deliverable.

## Required setup before production

1. Copy `.env.example` to `.env.local`.
2. Set a unique random `SESSION_SECRET` of at least 32 characters.
3. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` for real email delivery.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is server-only; never rename it to a `NEXT_PUBLIC_` variable.
5. Set a unique institution-controlled `TEACHER_REGISTRATION_CODE` of at least 32 characters. Teacher signup remains disabled until this is configured.
6. Run the full `supabase-schema.sql` against the Supabase project. This creates `auth_challenges`, `account_roles`, `auth_rate_limits`, the rate-limit RPC, and enables RLS.
7. Restart the Next.js server.

## Verification performed

- TypeScript validation: `tsc --noEmit` passed.
- A full Next.js production build could not be completed in this environment: the uploaded Windows dependency tree did not contain the Linux SWC binary and network access to download it was unavailable. Reinstall dependencies on the target Windows machine with `npm ci`, then run `npm run build`.

## Remaining scope / limitations

- Dashboard profile display fields and academic records still use browser localStorage. The signed server cookie and database role are authoritative for API authorization, but the dashboard data itself has not been migrated to server persistence in this security-only pass.
- Existing accounts have no `account_roles` records until they complete the new role-lock flow. The first successful login after applying the schema may ask an existing user to complete onboarding again. Existing local profiles are reused when their email and server role match.
- Teacher registration uses one institution-wide secret plus an emailed one-time teacher code. For a real school deployment, replace the shared registration secret with administrator-issued, single-use teacher invitations tied to an employee record.
- The current schema keeps the academic data tables shared across all authenticated accounts; it does not implement per-class or per-school tenant isolation.
