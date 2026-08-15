"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Copy,
  Share2,
  Gift,
  Check,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { referralService } from "@/services";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Referral } from "@/types";

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "neutral" | "error"
> = {
  REWARDED: "success",
  COMPLETED: "success",
  PENDING: "warning",
  EXPIRED: "neutral",
};

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const { data: codeData } = useQuery({
    queryKey: ["referral-code"],
    queryFn: referralService.getMyCode,
  });

  const { data: referralsData, isLoading } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: referralService.getMyReferrals,
  });

  // Backend returns data: { code: '...' } — extract the code string
  const code = codeData?.data?.code ?? "";
  const referrals = (referralsData?.data ?? []) as Referral[];
  const completed = referrals.filter(
    (r) => r.status === "COMPLETED" || r.status === "REWARDED",
  ).length;
  const pending = referrals.filter((r) => r.status === "PENDING").length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Join Cashmova — peer-to-peer currency exchange! Use my code ${code} to get started. https://cashmova.com`;
    if (navigator.share) {
      await navigator.share({ title: "Join Cashmova", text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Share text copied!");
    }
  };

  const stagger = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={stagger}>
        <PageHeader
          title="Referrals"
          description="Invite friends and earn rewards together"
        />
      </motion.div>

      {/* Hero */}
      <motion.div
        variants={stagger}
        className="relative overflow-hidden rounded-2xl p-8 text-white text-center"
        style={{
          background:
            "linear-gradient(135deg, #1A6BFF 0%, #0D4FCC 40%, #00C896 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl">Invite & Earn</h2>
          <p className="text-blue-100/80 text-sm font-body mt-2 max-w-sm mx-auto leading-relaxed">
            Share your code with friends. Both of you earn rewards when they
            complete their first swap.
          </p>
        </div>
      </motion.div>

      {/* Code card */}
      {code && (
        <motion.div
          variants={stagger}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] text-center"
        >
          <p className="text-sm text-[var(--color-text-secondary)] font-body mb-3">
            Your Referral Code
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[var(--color-bg)] border-2 border-dashed border-[var(--color-primary)]/40 mb-5">
            <span className="font-display font-black text-3xl text-[var(--color-primary)] tracking-[0.2em]">
              {code}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className={cn(
                "inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold font-body transition-all",
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white",
              )}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold font-body hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--shadow-primary)]"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div variants={stagger} className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Referred",
            value: referrals.length,
            Icon: Users,
            color: "text-[var(--color-primary)]",
            bg: "bg-[var(--color-primary-light)]",
          },
          {
            label: "Completed",
            value: completed,
            Icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Pending",
            value: pending,
            Icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] text-center"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
                bg,
              )}
            >
              <Icon size={20} className={color} />
            </div>
            <p className={cn("font-display font-bold text-2xl", color)}>
              {value}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* How it works */}
      <motion.div
        variants={stagger}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
      >
        <h3 className="font-display font-bold text-[var(--color-text-primary)] mb-4">
          How it works
        </h3>
        <div className="space-y-3">
          {[
            {
              num: "1",
              title: "Share your code",
              desc: "Send your unique referral code to friends",
            },
            {
              num: "2",
              title: "Friend signs up",
              desc: "They create an account using your code",
            },
            {
              num: "3",
              title: "Both get rewarded",
              desc: "Earn bonus when they complete their first swap",
            },
          ].map(({ num, title, desc }) => (
            <div
              key={num}
              className="flex items-start gap-4 py-3 border-b border-[var(--color-divider)] last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold font-body shrink-0">
                {num}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body">
                  {title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referral list */}
      {referrals.length > 0 && (
        <motion.div
          variants={stagger}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden"
        >
          <div className="p-5 border-b border-[var(--color-border)]">
            <h3 className="font-display font-bold text-[var(--color-text-primary)]">
              Your Referrals
            </h3>
          </div>
          <div className="divide-y divide-[var(--color-divider)]">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-bg)] transition-colors"
              >
                <UserAvatar name={r.referred.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] font-body truncate">
                    {r.referred.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-body mt-0.5">
                    Joined {formatRelative(r.referred.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  label={r.status}
                  variant={STATUS_VARIANT[r.status] ?? "neutral"}
                />
                {r.referrerReward && (
                  <span className="text-xs font-bold text-emerald-600 font-body">
                    +${r.referrerReward}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
