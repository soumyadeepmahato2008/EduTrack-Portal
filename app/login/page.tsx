"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, STORAGE_KEYS } from "@/lib/store";
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  Clock,
  RotateCcw,
  AlertCircle,
  KeyRound,
  Info,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Step 1: Input details
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  // Step 2: OTP verification step
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes = 600s
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Dev mode: shown when SMTP not configured
  const [devModeOtp, setDevModeOtp] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => { if (response.ok) router.replace("/"); })
      .catch(() => undefined);
  }, [router]);

  // 10-Minute Countdown Timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOtpStep && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpStep, timeLeftSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Request OTP via real API
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your Gmail account address.");
      return;
    }

    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid Gmail address (e.g. yourname@gmail.com).");
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || "Failed to send OTP. Please try again.");
        setIsLoading(false);
        return;
      }

      // Dev mode: show OTP on-screen if SMTP not configured
      if (data.devMode && data.devOtp) {
        setDevModeOtp(data.devOtp);
      } else {
        setDevModeOtp(null);
      }

      setIsOtpStep(true);
      setTimeLeftSeconds(600);
    } catch (err: any) {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP via real API
  const handleResendOtp = async () => {
    if (!email.trim()) return;
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setTimeLeftSeconds(600);
        setResendSuccess(true);
        setOtpCode("");
        if (data.devMode && data.devOtp) {
          setDevModeOtp(data.devOtp);
        }
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || "Failed to resend OTP.");
      }
    } catch {
      setErrorMessage("Network error while resending OTP.");
    }
  };

  // Step 3: Verify OTP via real API
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage("Please enter the complete 6-digit OTP sent to your Gmail.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpCode.trim() }),
      });
      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || "Invalid OTP. Please try again.");
        setIsVerifying(false);
        return;
      }


      const currentProfile = getCurrentUser();
      if (data.role !== "pending" && currentProfile?.email.toLowerCase() === email.trim().toLowerCase() && currentProfile.role === data.role && currentProfile.isRoleLocked) {
        router.replace("/");
        return;
      }

      // Save profile display metadata only; the HttpOnly server cookie is the credential.
      const googleAuthData = {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`,
        verifiedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEYS.GOOGLE_TEMP_AUTH, JSON.stringify(googleAuthData));

      setTimeout(() => {
        setIsVerifying(false);
        router.push("/onboarding");
      }, 400);
    } catch {
      setErrorMessage("Network error during verification. Please try again.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 mb-4">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            EduTrack Portal
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Sign in with your Gmail account. A secure 10-minute OTP will be delivered to your inbox.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>A fresh OTP has been sent to {email}. Valid for 10 minutes.</span>
            </div>
          )}

          {/* Dev Mode Banner */}
          {devModeOtp && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                Development Mode — SMTP not configured
              </div>
              <p>
                Your OTP is:{" "}
                <span className="font-mono font-black text-base text-amber-900 tracking-widest">
                  {devModeOtp}
                </span>
              </p>
              <p className="text-[11px] text-amber-700">
                Add <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> to{" "}
                <code>.env.local</code> to send real emails.
              </p>
            </div>
          )}

          {!isOtpStep ? (
            /* STEP 1: Enter your Gmail and Full Name */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  Your Gmail Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.sharma@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? "Sending OTP to Gmail..." : "Continue with Google (Send OTP)"}</span>
              </button>

              <div className="pt-3 text-[11px] text-slate-500 text-center">
                A 6-digit OTP code will be sent to your Gmail inbox and will remain valid for 10 minutes.
              </div>
            </form>
          ) : (
            /* STEP 2: Enter 6-digit OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Verify Your Gmail OTP
                </h3>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit code sent to:
                  <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {email}
                  </span>
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold font-mono py-3 rounded-2xl border-2 border-blue-500/50 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expires in:</span>
                  <span
                    className={`font-mono font-bold ${
                      timeLeftSeconds < 60 ? "text-rose-600" : "text-blue-600"
                    }`}
                  >
                    {formatTimer(timeLeftSeconds)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isVerifying || otpCode.length < 6}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifying ? "Verifying OTP..." : "Verify & Continue"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setErrorMessage("");
                  setDevModeOtp(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
              >
                ← Change Gmail Address
              </button>
            </form>
          )}

          {/* Guidelines */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Step 1: Enter your Gmail & verify with OTP</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Step 2: OTP sent to your Gmail inbox (10 min validity)</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Step 3: Select Student or Teacher Role (Irreversible)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
