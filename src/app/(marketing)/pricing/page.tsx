"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Building2, ArrowLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Star,
    price: { month: 0, year: 0 },
    description:
      "Everything you need to start exchanging currency with real people.",
    color: "#6B7280",
    highlight: false,
    features: [
      "Up to 3 active offers",
      "Standard matching algorithm",
      "Basic rate analytics",
      "Community support",
      "In-app messaging",
      "Trust score tracking",
    ],
    cta: "Get started free",
    href: "/register",
  },
  {
    id: "premium",
    name: "Premium",
    icon: Zap,
    price: { month: 9.99, year: 79.99 },
    description:
      "For frequent travellers and expats who need the best rates and tools.",
    color: "#1A6BFF",
    highlight: true,
    badge: "Most popular",
    trial: "7-day free trial",
    features: [
      "Unlimited active offers",
      "Priority matching algorithm",
      "Advanced rate analytics & alerts",
      "Verified trader badge",
      "Priority support (24h response)",
      "Reduced trust score threshold",
      "Early access to new features",
    ],
    cta: "Start free trial",
    href: "/register?plan=PREMIUM_MONTHLY",
  },
  {
    id: "business",
    name: "Business",
    icon: Building2,
    price: { month: 29.99, year: 239.99 },
    description:
      "For businesses, digital nomads, and high-volume currency exchangers.",
    color: "#8B5CF6",
    highlight: false,
    trial: "7-day free trial",
    features: [
      "Everything in Premium",
      "Multi-currency portfolio",
      "REST API access",
      "Up to 5 team members",
      "Custom rate alert webhooks",
      "Bulk swap requests",
      "Dedicated account manager",
      "SLA guarantee (99.9% uptime)",
    ],
    cta: "Start free trial",
    href: "/register?plan=BUSINESS_MONTHLY",
  },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes — Premium and Business plans include a 7-day free trial. No credit card required to try the core free plan.",
  },
  {
    q: "Which currencies are supported?",
    a: "Cashmova supports 120+ currencies across Europe, North America, the Middle East, and beyond. EUR, GBP, USD, CHF, CAD, AUD, SEK, NOK, DKK and many more.",
  },
  {
    q: "How does pricing compare to banks?",
    a: "Our traders typically exchange at or near the mid-market rate. Banks usually add a 2-5% spread on top. On a £10,000 exchange that's £200-£500 you keep.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, anytime from your billing dashboard. You keep access until the end of your paid period. No cancellation fees.",
  },
  {
    q: "Is Cashmova regulated?",
    a: "Cashmova is registered with the FCA in the United Kingdom and complies with AML and KYC regulations across all operating regions.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. All subscription payments are processed securely in USD.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"month" | "year">("month");

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Back nav */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0F1729] font-body transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center">
        <p className="text-xs font-bold text-[#1A6BFF] uppercase tracking-widest font-body mb-3">
          Pricing
        </p>
        <h1 className="font-display font-black text-5xl text-[#0F1729] mb-4 tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-[#6B7280] font-body text-lg">
          Start free. Upgrade when you need more power. All prices in USD,
          billed via Stripe.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center bg-[#F7F8FC] border border-[#E4E7EF] rounded-2xl p-1 mt-8">
          <button
            onClick={() => setBilling("month")}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-semibold font-body transition-all",
              billing === "month"
                ? "bg-white shadow-sm text-[#0F1729]"
                : "text-[#6B7280] hover:text-[#374151]",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("year")}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-semibold font-body transition-all flex items-center gap-2",
              billing === "year"
                ? "bg-white shadow-sm text-[#0F1729]"
                : "text-[#6B7280] hover:text-[#374151]",
            )}
          >
            Annual
            <span className="text-[10px] font-bold text-[#00C896] bg-[#E0FBF4] px-2 py-0.5 rounded-full">
              Save 33%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map(
            (
              {
                id,
                name,
                icon: Icon,
                price,
                description,
                color,
                highlight,
                badge,
                trial,
                features,
                cta,
                href,
              },
              i,
            ) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative rounded-3xl p-8 flex flex-col",
                  highlight
                    ? "bg-[#0D1526] text-white ring-2 ring-[#1A6BFF] shadow-2xl scale-[1.02]"
                    : "bg-[#F7F8FC] border border-[#E4E7EF]",
                )}
              >
                {badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#1A6BFF] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow font-body">
                      {badge}
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: highlight
                        ? "rgba(255,255,255,0.1)"
                        : `${color}15`,
                    }}
                  >
                    <Icon
                      size={19}
                      style={{ color: highlight ? "#fff" : color }}
                    />
                  </div>
                  <h3
                    className={cn(
                      "font-display font-bold text-xl",
                      highlight ? "text-white" : "text-[#0F1729]",
                    )}
                  >
                    {name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {price.month === 0 ? (
                    <p
                      className={cn(
                        "font-display font-black text-5xl",
                        highlight ? "text-white" : "text-[#0F1729]",
                      )}
                    >
                      Free
                    </p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <p
                        className={cn(
                          "font-display font-black text-5xl leading-none",
                          highlight ? "text-white" : "text-[#0F1729]",
                        )}
                      >
                        $
                        {billing === "month"
                          ? price.month
                          : (price.year / 12).toFixed(2)}
                      </p>
                      <p
                        className={cn(
                          "text-sm mb-1.5",
                          highlight ? "text-white/50" : "text-[#9CA3AF]",
                        )}
                      >
                        /mo
                      </p>
                    </div>
                  )}
                  {billing === "year" && price.month > 0 && (
                    <p
                      className={cn(
                        "text-xs mt-1 font-body",
                        highlight ? "text-white/60" : "text-[#9CA3AF]",
                      )}
                    >
                      Billed ${price.year}/year
                    </p>
                  )}
                  {trial && (
                    <p
                      className={cn(
                        "text-xs font-semibold mt-2 font-body",
                        highlight ? "text-[#00C896]" : "text-[#00C896]",
                      )}
                    >
                      ✓ {trial}
                    </p>
                  )}
                </div>

                <p
                  className={cn(
                    "text-sm leading-relaxed mb-6 font-body",
                    highlight ? "text-white/60" : "text-[#6B7280]",
                  )}
                >
                  {description}
                </p>

                {/* CTA */}
                <Link
                  href={href}
                  className={cn(
                    "w-full h-12 rounded-2xl font-semibold text-sm font-body flex items-center justify-center transition-all mb-8",
                    highlight
                      ? "bg-[#1A6BFF] text-white hover:bg-[#0D4FCC] shadow-[0_4px_20px_rgba(26,107,255,.5)]"
                      : "bg-white border border-[#E4E7EF] text-[#374151] hover:bg-[#F7F8FC]",
                  )}
                >
                  {cta}
                </Link>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: highlight
                            ? "rgba(0,200,150,0.2)"
                            : "#E0FBF4",
                        }}
                      >
                        <Check size={11} className="text-[#00C896]" />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-body",
                          highlight ? "text-white/80" : "text-[#374151]",
                        )}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ),
          )}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-[#9CA3AF] font-body">
          {[
            "🔒 Stripe-secured payments",
            "🏦 FCA registered",
            "✅ No hidden fees",
            "🔄 Cancel anytime",
            "🛡️ SOC 2 compliant",
          ].map((b) => (
            <span key={b}>{b}</span>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="font-display font-black text-3xl text-[#0F1729] mb-10 text-center">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group bg-[#F7F8FC] border border-[#E4E7EF] rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-[#0F1729] font-body text-sm list-none">
                {q}
                <ChevronIcon />
              </summary>
              <p className="px-6 pb-5 text-sm text-[#6B7280] font-body leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 transition-transform group-open:rotate-180"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
