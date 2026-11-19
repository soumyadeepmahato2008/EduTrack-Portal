"use client";

import React, { useState, useEffect } from "react";
import { SentEmailNotification } from "@/lib/emailService";
import { Mail, X, Copy, Check, Sparkles, Key } from "lucide-react";

export const EmailNotificationBanner: React.FC = () => {
  const [notification, setNotification] = useState<SentEmailNotification | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEmail = (e: Event) => {
      const customEvent = e as CustomEvent<SentEmailNotification>;
      if (customEvent.detail) {
        setNotification(customEvent.detail);
        setCopied(false);
      }
    };

    window.addEventListener("edutrack_email_received", handleEmail);
    return () => window.removeEventListener("edutrack_email_received", handleEmail);
  }, []);

  if (!notification) return null;

  const handleCopy = () => {
    if (notification.code) {
      navigator.clipboard.writeText(notification.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm sm:max-w-md w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-blue-500/40 animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-400">
              📬 Gmail Notification Simulation
            </span>
            <p className="text-[11px] text-slate-300 truncate max-w-[240px]">
              To: {notification.toEmail}
            </p>
          </div>
        </div>

        <button
          onClick={() => setNotification(null)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 text-xs space-y-2">
        <p className="font-semibold text-slate-200">{notification.subject}</p>
        <p className="text-slate-400 text-[11px] whitespace-pre-line leading-relaxed">
          {notification.body}
        </p>

        {notification.code && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider">
              {notification.code}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
