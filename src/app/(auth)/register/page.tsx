"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { registerSchema, type RegisterFormData } from "@/lib/validators";
import { cn } from "@/lib/utils";

const Field = ({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-[var(--color-text-secondary)] font-body">
      {label}
      {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-[var(--color-error)] font-body">{error}</p>
    )}
  </div>
);

const inputCls = (err?: string) =>
  cn(
    "w-full h-11 px-4 rounded-xl border bg-[var(--color-surface)] font-body text-sm",
    "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
    "transition-all outline-none focus:ring-2",
    err
      ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
      : "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20",
  );

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...payload } = data;
      await registerUser(payload);
      toast.success(
        "Account created! Please check your email to verify your account.",
      );
      // Redirect to verify-email page, NOT dashboard
      // The user must verify their email before accessing the platform
      router.push("/verify-email");
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] tracking-tight">
          Create account
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)] font-body text-sm">
          Join Cashmova and start exchanging currencies safely
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {["Account", "Verify Email", "Start Trading"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-body",
                i === 0
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-border)] text-[var(--color-text-muted)]",
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-body",
                i === 0
                  ? "text-[var(--color-primary)] font-semibold"
                  : "text-[var(--color-text-muted)]",
              )}
            >
              {s}
            </span>
            {i < 2 && <div className="h-px w-4 bg-[var(--color-border)]" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full Name" error={errors.name?.message} required>
          <input
            {...register("name")}
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className={inputCls(errors.name?.message)}
          />
        </Field>

        <Field label="Email Address" error={errors.email?.message} required>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputCls(errors.email?.message)}
          />
        </Field>

        <Field label="Phone Number" error={errors.phone?.message}>
          <input
            {...register("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="+1 234 567 8900"
            className={inputCls(errors.phone?.message)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" error={errors.password?.message} required>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="Min 8 characters"
                className={cn(inputCls(errors.password?.message), "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <Field
            label="Confirm Password"
            error={errors.confirmPassword?.message}
            required
          >
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConf ? "text" : "password"}
                placeholder="Repeat password"
                className={cn(
                  inputCls(errors.confirmPassword?.message),
                  "pr-10",
                )}
              />
              <button
                type="button"
                onClick={() => setShowConf((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
        </div>

        <Field label="Referral Code" error={errors.referralCode?.message}>
          <input
            {...register("referralCode")}
            type="text"
            placeholder="Optional"
            className={inputCls(errors.referralCode?.message)}
          />
        </Field>

        <p className="text-xs text-[var(--color-text-muted)] font-body">
          By creating an account you agree to our{" "}
          <Link
            href="/terms"
            className="text-[var(--color-primary)] hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-[var(--color-primary)] hover:underline"
          >
            Privacy Policy
          </Link>
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full h-12 rounded-xl font-display font-semibold text-white text-sm mt-1",
            "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]",
            "shadow-[var(--shadow-primary)] transition-all flex items-center justify-center gap-2",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UserPlus size={18} />
          )}
          {isLoading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)] font-body">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--color-primary)] font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
