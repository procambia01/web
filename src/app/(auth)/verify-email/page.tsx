"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/utils";

type State = "verifying" | "success" | "error" | "resend";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "verifying" : "resend");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    authService
      .verifyEmail(token)
      .then(() => {
        setState("success");
        toast.success("Email verified! Redirecting…");
        setTimeout(() => router.push("/dashboard"), 2500);
      })
      .catch(() => setState("error"));
  }, [token, router]);

  const handleResend = async () => {
    if (!email.trim()) return toast.error("Enter your email first");
    setSending(true);
    try {
      await authService.resendVerification(email.trim());
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Could not send email. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      {/* Verifying */}
      {state === "verifying" && (
        <>
          <div className="flex justify-center">
            <Loader2
              size={48}
              className="animate-spin text-[var(--color-primary)]"
            />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
              Verifying your email…
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] font-body">
              Please wait while we confirm your address.
            </p>
          </div>
        </>
      )}

      {/* Success */}
      {state === "success" && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
              Email Verified!
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] font-body">
              Your account is now active. Redirecting to your dashboard…
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm font-body hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Go to Dashboard
          </Link>
        </>
      )}

      {/* Error */}
      {state === "error" && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={32} className="text-red-500" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
              Link expired or invalid
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] font-body">
              This verification link has expired or already been used. Request a
              new one below.
            </p>
          </div>
          <button
            onClick={() => setState("resend")}
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm font-body hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Resend verification email
          </button>
        </>
      )}

      {/* Resend form (no token in URL) */}
      {state === "resend" && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
              <Mail size={32} className="text-[var(--color-primary)]" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] font-body">
              We sent a verification link to your email address. Check your
              inbox (and spam folder). If you didn&apos;t receive it, enter your
              email below.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(
                "w-full h-11 px-4 rounded-xl border bg-[var(--color-surface)] font-body text-sm",
                "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
                "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2",
                "focus:ring-[var(--color-primary)]/20 outline-none transition-all",
              )}
            />
            <button
              onClick={handleResend}
              disabled={sending}
              className={cn(
                "w-full h-11 rounded-xl font-display font-semibold text-white text-sm",
                "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors",
                "flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Mail size={16} />
              )}
              {sending ? "Sending…" : "Resend verification email"}
            </button>
          </div>
        </>
      )}

      <p className="text-sm text-[var(--color-text-secondary)] font-body">
        <Link
          href="/login"
          className="text-[var(--color-primary)] hover:underline font-semibold"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
