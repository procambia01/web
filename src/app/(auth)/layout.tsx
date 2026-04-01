import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1526 0%, #0D4FCC 60%, #1A6BFF 100%)' }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#1A6BFF] opacity-20 blur-[80px]" />
        <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-[#00C896] opacity-15 blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <span className="font-display font-black text-white text-lg">S</span>
            </div>
            <span className="font-display font-bold text-white text-xl">SwapFX</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-[#00C896] font-semibold text-sm tracking-widest uppercase font-body">
              Peer-to-peer currency exchange
            </p>
            <h1 className="font-display font-bold text-white text-4xl leading-tight">
              Exchange currencies<br />
              <span className="text-[#00C896]">with real people</span><br />
              near you
            </h1>
            <p className="text-blue-200/70 text-base font-body leading-relaxed max-w-sm">
              Get mid-market rates, build trust, and swap securely with verified traders across Europe, North America and beyond.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[
              { v: '50K+', l: 'Traders'      },
              { v: '120+', l: 'Currencies'   },
              { v: '98%',  l: 'Success Rate' },
            ].map(({ v, l }) => (
              <div key={l}>
                <p className="font-display font-bold text-white text-2xl">{v}</p>
                <p className="text-blue-200/60 text-xs font-body mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial — international user */}
        <div className="relative z-10 bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
          <p className="text-blue-100/80 text-sm font-body leading-relaxed italic">
            "I saved over €300 exchanging GBP to EUR before my Paris move. Found a match in London within the hour. SwapFX is brilliant."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A6BFF] to-[#00C896] flex items-center justify-center text-white text-xs font-bold">
              SM
            </div>
            <div>
              <p className="text-white text-sm font-semibold font-body">Sophie M.</p>
              <p className="text-blue-200/50 text-xs font-body">London, United Kingdom</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-[var(--color-bg)]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <span className="font-display font-black text-white">S</span>
          </div>
          <span className="font-display font-bold text-[var(--color-text-primary)] text-xl">SwapFX</span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
