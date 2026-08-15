"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Star,
  Users,
  TrendingUp,
  Check,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  Apple,
  Play,
  ArrowLeftRight,
  MapPin,
  Clock,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Nav ───────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 mt-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-sm px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A6BFF] flex items-center justify-center">
              <span className="font-display font-black text-white text-sm">
                S
              </span>
            </div>
            <span className="font-display font-bold text-[#0F1729] text-lg">
              Cashmova
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "How it works", href: "#how" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "/pricing" },
              { label: "App", href: "#app" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-[#6B7280] hover:text-[#0F1729] transition-colors font-body"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#6B7280] hover:text-[#0F1729] transition-colors font-body px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-[#1A6BFF] text-white text-sm font-semibold font-body hover:bg-[#0D4FCC] transition-colors shadow-[0_4px_20px_rgba(26,107,255,.35)]"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden text-[#6B7280]"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 rounded-2xl bg-white border border-[#E4E7EF] shadow-lg p-4 space-y-1"
          >
            {[
              { label: "How it works", href: "#how" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Download App", href: "#app" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-[#374151] hover:bg-[#F7F8FC] font-body"
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#F0F2F8] flex gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 h-10 rounded-xl border border-[#E4E7EF] text-sm font-semibold text-[#374151] flex items-center justify-center font-body"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex-1 h-10 rounded-xl bg-[#1A6BFF] text-white text-sm font-semibold flex items-center justify-center font-body"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
    >
      {/* Background */}
      <motion.div style={{ y }} className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#EBF1FF] via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#1A6BFF]/8 blur-[120px]" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-[#00C896]/8 blur-[100px]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#1A6BFF 1px,transparent 1px),linear-gradient(90deg,#1A6BFF 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </motion.div>

      {/* Floating rate cards */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {[
          {
            pair: "GBP/EUR",
            rate: "1.1742",
            change: "+0.3%",
            top: "20%",
            left: "5%",
            delay: 0,
          },
          {
            pair: "USD/EUR",
            rate: "0.9218",
            change: "+0.1%",
            top: "35%",
            right: "5%",
            delay: 0.3,
          },
          {
            pair: "USD/GBP",
            rate: "0.7831",
            change: "-0.2%",
            top: "65%",
            left: "8%",
            delay: 0.6,
          },
          {
            pair: "CHF/EUR",
            rate: "1.0451",
            change: "+0.4%",
            top: "70%",
            right: "4%",
            delay: 0.9,
          },
        ].map(({ pair, rate, change, top, left, right, delay }) => (
          <motion.div
            key={pair}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.8, duration: 0.5 }}
            style={{ position: "absolute", top, left, right }}
            className="hidden lg:block"
          >
            <div className="bg-white/80 backdrop-blur border border-white/80 rounded-2xl px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold text-[#6B7280] font-body">
                {pair}
              </p>
              <p className="font-display font-bold text-[#0F1729] text-lg leading-none mt-0.5">
                {rate}
              </p>
              <p
                className={cn(
                  "text-[11px] font-bold font-body mt-1",
                  change.startsWith("+") ? "text-[#00C896]" : "text-red-500",
                )}
              >
                {change}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div variants={stagger} initial="hidden" animate="show">
          {/* Badge */}
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 bg-[#1A6BFF]/8 border border-[#1A6BFF]/20 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A6BFF] animate-pulse" />
            <span className="text-xs font-semibold text-[#1A6BFF] font-body tracking-wide">
              Trusted by traders across 40+ countries
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-[#0F1729] leading-[1.05] tracking-tight mb-6"
          >
            Exchange currency
            <br />
            <span className="relative">
              <span className="text-[#1A6BFF]">peer-to-peer</span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="6"
                viewBox="0 0 300 6"
                fill="none"
              >
                <path
                  d="M0 5 Q75 1 150 4 Q225 7 300 3"
                  stroke="#00C896"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>{" "}
            without the bank
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={item}
            className="text-xl text-[#6B7280] font-body max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Cashmova connects real people to exchange foreign currency at live
            rates — no hidden fees, no bank spreads. Available across Europe,
            North America, and beyond.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-13 px-8 rounded-2xl bg-[#1A6BFF] text-white text-base font-semibold font-body hover:bg-[#0D4FCC] transition-all shadow-[0_8px_32px_rgba(26,107,255,.4)] hover:shadow-[0_8px_40px_rgba(26,107,255,.5)] hover:-translate-y-0.5 active:translate-y-0"
              style={{ height: 52 }}
            >
              Start for free <ArrowRight size={18} />
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-2 h-13 px-8 rounded-2xl border border-[#E4E7EF] bg-white text-[#374151] text-base font-semibold font-body hover:bg-[#F7F8FC] transition-colors"
              style={{ height: 52 }}
            >
              See how it works
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#6B7280] font-body"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["JM", "SC", "PB", "AK"].map((i, idx) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                    style={{
                      background: ["#1A6BFF", "#00C896", "#8B5CF6", "#F59E0B"][
                        idx
                      ],
                    }}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <span>50,000+ active traders</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="text-amber-400 text-base">
                  ★
                </span>
              ))}
              <span>4.9 on App Store & Play Store</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-[#00C896]" />
              <span>Bank-level security</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#9CA3AF]"
      >
        <span className="text-xs font-body">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Logos strip ───────────────────────────────────────────
function LogosStrip() {
  const logos = [
    "Visa",
    "Mastercard",
    "SWIFT",
    "SEPA",
    "Open Banking",
    "ISO 27001",
  ];
  return (
    <section className="border-y border-[#F0F2F8] py-8 bg-[#F7F8FC]/50">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-xs font-semibold text-[#9CA3AF] font-body uppercase tracking-widest mb-6">
          Integrated with
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {logos.map((l) => (
            <span
              key={l}
              className="text-sm font-display font-bold text-[#D1D5DB]"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: Users,
      title: "Create your account",
      desc: "Sign up in under 2 minutes. Verify your identity once to unlock all features and build trust with other traders.",
    },
    {
      num: "02",
      icon: ArrowLeftRight,
      title: "Post or find an offer",
      desc: "List how much currency you want to exchange and at what rate, or browse offers from verified traders near you.",
    },
    {
      num: "03",
      icon: MapPin,
      title: "Meet and exchange",
      desc: "Agree on a time and place — a café, co-working space, or any public spot. Our escrow system keeps both parties safe.",
    },
    {
      num: "04",
      icon: TrendingUp,
      title: "Build your reputation",
      desc: "Rate each other after every swap. Higher ratings and trust scores unlock better rates and premium features.",
    },
  ];

  return (
    <section id="how" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-[#1A6BFF] uppercase tracking-widest font-body mb-3">
            Simple process
          </p>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-[#0F1729] mb-4">
            How Cashmova works
          </h2>
          <p className="text-[#6B7280] font-body text-lg max-w-xl mx-auto">
            Exchange currency directly with real people — no bank required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ num, icon: Icon, title, desc }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              {/* Connector */}
              {i < 3 && (
                <div
                  className="hidden lg:block absolute top-10 left-full w-full h-px bg-[#E4E7EF] z-0"
                  style={{
                    width: "calc(100% - 40px)",
                    left: "calc(100% - 12px)",
                  }}
                />
              )}
              <div className="relative bg-[#F7F8FC] rounded-2xl p-6 border border-[#E4E7EF] group-hover:border-[#1A6BFF]/30 group-hover:bg-white transition-all group-hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1A6BFF]/10 flex items-center justify-center">
                    <Icon size={19} className="text-[#1A6BFF]" />
                  </div>
                  <span className="font-display font-black text-3xl text-[#E4E7EF]">
                    {num}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#0F1729] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[#6B7280] font-body leading-relaxed">
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: Globe,
      color: "#1A6BFF",
      bg: "#EBF1FF",
      title: "Live exchange rates",
      desc: "Real-time rates across 120+ currency pairs. Never pay outdated spreads from your bank again.",
    },
    {
      icon: Shield,
      color: "#00C896",
      bg: "#E0FBF4",
      title: "Identity verification",
      desc: "All traders are KYC-verified. Our trust score system ensures every swap is with a reputable person.",
    },
    {
      icon: Zap,
      color: "#8B5CF6",
      bg: "#EDE9FE",
      title: "Instant matching",
      desc: "Our algorithm finds the best match for your currency pair, amount, location, and preferred rate.",
    },
    {
      icon: Lock,
      color: "#F59E0B",
      bg: "#FFFBEB",
      title: "Escrow protection",
      desc: "Both parties confirm the exchange before it completes. No risk of getting shortchanged.",
    },
    {
      icon: Smartphone,
      color: "#EF4444",
      bg: "#FEF2F2",
      title: "Mobile-first",
      desc: "Available on iOS and Android. Exchange currency on the go, anytime, anywhere in the world.",
    },
    {
      icon: TrendingUp,
      color: "#0EA5E9",
      bg: "#E0F2FE",
      title: "Rate analytics",
      desc: "Track historical rates, set alerts, and time your exchange perfectly for the best deal.",
    },
  ];

  return (
    <section
      id="features"
      className="py-24"
      style={{ background: "linear-gradient(180deg, #F7F8FC 0%, white 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-[#1A6BFF] uppercase tracking-widest font-body mb-3">
            Why Cashmova
          </p>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-[#0F1729] mb-4">
            Built for global travellers
            <br />
            and expats
          </h2>
          <p className="text-[#6B7280] font-body text-lg max-w-xl mx-auto">
            Whether you're moving money from London to Berlin or New York to
            Paris, Cashmova gets you the rate you deserve.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, color, bg, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-6 border border-[#E4E7EF] hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: bg }}
              >
                <Icon size={21} style={{ color }} />
              </div>
              <h3 className="font-display font-bold text-lg text-[#0F1729] mb-2">
                {title}
              </h3>
              <p className="text-sm text-[#6B7280] font-body leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      name: "Sophie M.",
      location: "London → Paris",
      initials: "SM",
      color: "#1A6BFF",
      stars: 5,
      text: "Saved over €200 on my relocation exchange. Found a match in London within 20 minutes. The process was smooth and secure.",
    },
    {
      name: "James K.",
      location: "New York → London",
      initials: "JK",
      color: "#00C896",
      stars: 5,
      text: "As a frequent traveller, Cashmova has become essential. I get rates 3–5% better than any bank or bureau de change.",
    },
    {
      name: "Luisa B.",
      location: "Berlin → Zurich",
      initials: "LB",
      color: "#8B5CF6",
      stars: 5,
      text: "The verification system gives me confidence. I knew exactly who I was meeting. Will never use a bank for forex again.",
    },
    {
      name: "Pierre D.",
      location: "Paris → Amsterdam",
      initials: "PD",
      color: "#F59E0B",
      stars: 5,
      text: "Found a match within an hour and met at a café near my office. Exchanged €1,500 at the mid-market rate. Brilliant concept.",
    },
    {
      name: "Aisha T.",
      location: "Dubai → London",
      initials: "AT",
      color: "#EF4444",
      stars: 5,
      text: "Moving from Dubai to London, I saved thousands on currency exchange. The platform is intuitive and the community is trustworthy.",
    },
    {
      name: "Marco R.",
      location: "Milan → Barcelona",
      initials: "MR",
      color: "#0EA5E9",
      stars: 5,
      text: "Cashmova is the Airbnb of currency exchange. Brilliant execution, great rates, and a community of honest traders.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-[#1A6BFF] uppercase tracking-widest font-body mb-3">
            Trusted globally
          </p>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-[#0F1729] mb-4">
            Traders love Cashmova
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-amber-400 text-xl">
                ★
              </span>
            ))}
            <span className="ml-2 text-sm font-semibold text-[#374151] font-body">
              4.9 / 5 from 8,200+ reviews
            </span>
          </div>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {reviews.map(({ name, location, initials, color, stars, text }) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="break-inside-avoid bg-[#F7F8FC] rounded-2xl p-5 border border-[#E4E7EF]"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-[#374151] font-body leading-relaxed mb-4 italic">
                "{text}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F1729] font-body">
                    {name}
                  </p>
                  <p className="text-xs text-[#9CA3AF] font-body">{location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stats banner ──────────────────────────────────────────
function Stats() {
  const stats = [
    { value: "50K+", label: "Active traders", sub: "across 40+ countries" },
    { value: "$2.4B", label: "Volume exchanged", sub: "in 2024" },
    { value: "98.2%", label: "Swap success rate", sub: "verified completion" },
    { value: "3.4%", label: "Avg. rate savings", sub: "vs traditional banks" },
  ];
  return (
    <section
      className="py-20"
      style={{
        background:
          "linear-gradient(135deg, #0D1526 0%, #0D4FCC 55%, #1A6BFF 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, label, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display font-black text-4xl sm:text-5xl text-white mb-1">
                {value}
              </p>
              <p className="text-sm font-semibold text-blue-200 font-body">
                {label}
              </p>
              <p className="text-xs text-blue-300/60 font-body mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── App download ──────────────────────────────────────────
function AppDownload() {
  return (
    <section id="app" className="py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-[#0D1526] to-[#1A6BFF] rounded-3xl overflow-hidden p-8 sm:p-16">
          {/* Deco */}
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute right-20 -bottom-12 w-48 h-48 rounded-full bg-[#00C896]/15" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Smartphone size={13} className="text-[#00C896]" />
                <span className="text-xs font-semibold text-white/80 font-body">
                  Available on iOS & Android
                </span>
              </div>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">
                Exchange on the go
              </h2>
              <p className="text-blue-100/70 font-body leading-relaxed mb-8 max-w-md">
                Download the Cashmova app to find traders, arrange swaps, and chat
                — all from your pocket. Real-time notifications keep you updated
                on every offer and swap.
              </p>

              {/* Download buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="#"
                  className="inline-flex items-center gap-3 bg-white text-[#0F1729] rounded-2xl px-6 py-3.5 hover:bg-blue-50 transition-colors"
                >
                  <Apple size={22} />
                  <div className="text-left">
                    <p className="text-[10px] font-body text-[#6B7280]">
                      Download on the
                    </p>
                    <p className="text-sm font-bold font-display">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-3 bg-white/10 border border-white/25 text-white rounded-2xl px-6 py-3.5 hover:bg-white/20 transition-colors"
                >
                  <Play size={20} className="fill-white" />
                  <div className="text-left">
                    <p className="text-[10px] font-body text-white/60">
                      Get it on
                    </p>
                    <p className="text-sm font-bold font-display">
                      Google Play
                    </p>
                  </div>
                </a>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-6 mt-6 justify-center lg:justify-start">
                {[
                  { store: "App Store", rating: "4.9", reviews: "2.1K" },
                  { store: "Google Play", rating: "4.8", reviews: "5.4K" },
                ].map(({ store, rating, reviews }) => (
                  <div key={store} className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-amber-400 text-xs">
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-white/80 text-xs font-body">
                      {rating} ({reviews} reviews)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mock phone */}
            <div className="relative flex-shrink-0">
              <div className="w-52 h-[420px] bg-white/10 backdrop-blur border border-white/20 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <span className="text-white text-[11px] font-bold">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-2 bg-white/60 rounded-sm" />
                    <div className="w-2 h-2 rounded-full bg-white/60" />
                  </div>
                </div>
                {/* App header */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-[10px] font-body">
                        Good morning
                      </p>
                      <p className="text-white text-sm font-bold font-display">
                        Sophie
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/20" />
                  </div>
                </div>
                {/* Rate card */}
                <div className="mx-4 bg-white/15 rounded-xl p-3 mb-2">
                  <p className="text-white/60 text-[9px] font-body mb-1">
                    Live Rate
                  </p>
                  <p className="text-white font-display font-bold text-lg">
                    GBP/EUR 1.1742
                  </p>
                  <p className="text-[#00C896] text-[10px] font-bold font-body mt-0.5">
                    ↑ +0.3% today
                  </p>
                </div>
                {/* Offers */}
                {[
                  { pair: "£500 → €588", user: "James K.", dist: "0.8km" },
                  { pair: "£200 → €235", user: "Luisa B.", dist: "1.2km" },
                ].map(({ pair, user, dist }) => (
                  <div
                    key={pair}
                    className="mx-4 bg-white/8 rounded-xl p-2.5 mb-1.5 flex items-center gap-2.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1A6BFF] flex items-center justify-center text-white text-[8px] font-bold">
                      {user[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-[10px] font-bold font-body">
                        {pair}
                      </p>
                      <p className="text-white/50 text-[9px] font-body">
                        {user} · {dist}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Bottom tab bar */}
                <div className="mt-auto mx-3 mb-4 bg-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-around">
                  {["home", "repeat", "message-square", "user"].map((i) => (
                    <div key={i} className="w-5 h-5 bg-white/30 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing teaser ─────────────────────────────────────────
function PricingTeaser() {
  return (
    <section className="py-24 bg-[#F7F8FC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs font-bold text-[#1A6BFF] uppercase tracking-widest font-body mb-3">
          Pricing
        </p>
        <h2 className="font-display font-black text-4xl sm:text-5xl text-[#0F1729] mb-4">
          Start free, upgrade anytime
        </h2>
        <p className="text-[#6B7280] font-body text-lg max-w-xl mx-auto mb-10">
          The core Cashmova experience is always free. Upgrade to Premium or
          Business for unlimited offers, priority matching, and advanced
          analytics.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-[#1A6BFF] text-white text-sm font-semibold font-body hover:bg-[#0D4FCC] transition-colors shadow-[0_4px_20px_rgba(26,107,255,.35)]"
          >
            Get started free <ArrowRight size={15} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl border border-[#E4E7EF] bg-white text-[#374151] text-sm font-semibold font-body hover:bg-white/80 transition-colors"
          >
            See all plans
          </Link>
        </div>
        <p className="text-xs text-[#9CA3AF] font-body mt-4">
          No credit card required · 7-day Premium trial
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  const cols = [
    {
      heading: "Product",
      links: [
        "How it works",
        "Features",
        "Pricing",
        "Download App",
        "Security",
      ],
    },
    {
      heading: "Company",
      links: ["About us", "Blog", "Press", "Careers", "Contact"],
    },
    {
      heading: "Support",
      links: ["Help Centre", "Status", "Community", "API docs", "Compliance"],
    },
    {
      heading: "Legal",
      links: [
        "Privacy Policy",
        "Terms of Service",
        "Cookie Policy",
        "AML Policy",
      ],
    },
  ];

  return (
    <footer className="bg-[#0D1526] text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#1A6BFF] flex items-center justify-center">
                <span className="font-display font-black text-white text-sm">
                  S
                </span>
              </div>
              <span className="font-display font-bold text-white text-lg">
                Cashmova
              </span>
            </div>
            <p className="text-slate-400 text-sm font-body leading-relaxed max-w-xs">
              Peer-to-peer currency exchange for a borderless world.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
              <span className="text-xs text-slate-400 font-body">
                All systems operational
              </span>
            </div>
          </div>

          {cols.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 font-body mb-4">
                {heading}
              </p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 hover:text-white transition-colors font-body"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-body">
            © {new Date().getFullYear()} Cashmova Ltd. All rights reserved.
            Registered in England & Wales. FCA regulated.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-body">
            <span>🇬🇧 United Kingdom</span>
            <span>🇺🇸 United States</span>
            <span>🇩🇪 Germany</span>
            <span>🇫🇷 France</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────
export default function LandingContent() {
  return (
    <div className="bg-white font-body">
      <Nav />
      <Hero />
      <LogosStrip />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <AppDownload />
      <PricingTeaser />
      <Footer />
    </div>
  );
}
