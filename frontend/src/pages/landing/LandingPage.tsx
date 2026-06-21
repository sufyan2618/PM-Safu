import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useLottie } from 'lottie-react';
import {
  FileText, Users, DollarSign, BarChart3, Shield, Zap,
  ChevronDown, ChevronRight, Mail, Phone, MapPin, Menu, X,
  CheckCircle2, ArrowRight, Sparkles, Building2, Clock, Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes.constants';
import loginAnimation from '@/animations/Login.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function useCountUp(target: number, duration = 1800) {
  const val = useMotionValue(0);
  const spring = useSpring(val, { duration, bounce: 0 });
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (inView) val.set(target);
  }, [inView, val, target]);

  useEffect(() => spring.on('change', (v) => setDisplay(Math.round(v))), [spring]);

  return { ref, display };
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Components ────────────────────────────────────────────────────────────────

// Reduced blur radius — blur-[80px] forces expensive GPU compositing
function GlowOrb({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute rounded-full blur-2xl', className)}
      aria-hidden
    />
  );
}

// Removed CSS filter (hue-rotate) — it disables GPU compositing and forces
// software rasterization of every Lottie frame, causing severe jank.
function HeroLottie() {
  const { View } = useLottie({
    animationData: loginAnimation,
    loop: true,
    autoplay: true,
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
  });
  return <div className="w-full">{View}</div>;
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
      <Sparkles size={10} />
      {children}
    </span>
  );
}

// ── Payroll chart ─────────────────────────────────────────────────────────────

const PAYROLL_DATA = [
  { month: 'Jan', value: 38, runs: 11 },
  { month: 'Feb', value: 41, runs: 12 },
  { month: 'Mar', value: 36, runs: 11 },
  { month: 'Apr', value: 52, runs: 14 },
  { month: 'May', value: 47, runs: 13 },
  { month: 'Jun', value: 61, runs: 16 },
];

function PayrollChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const max = Math.max(...PAYROLL_DATA.map((d) => d.value));
  const peakIdx = PAYROLL_DATA.findIndex((d) => d.value === max);

  return (
    <div
      ref={ref}
      className="mt-16 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6"
    >
      <div className="mb-6 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-emerald-400" />
          <p className="text-sm font-medium text-slate-300">Payroll disbursed</p>
          <span className="text-xs text-slate-600">· last 6 months</span>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold text-white">$275k</p>
          <p className="flex items-center justify-end gap-1 text-xs text-emerald-400">
            <ArrowRight size={11} className="-rotate-45" />
            +18.4% vs prev
          </p>
        </div>
      </div>

      <div className="relative h-44">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((g) => (
            <div key={g} className="border-t border-slate-800/70" />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end justify-between gap-3 sm:gap-5">
          {PAYROLL_DATA.map((d, i) => {
            const h = (d.value / max) * 100;
            const isPeak = i === peakIdx;
            return (
              <div key={d.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    isPeak ? 'text-emerald-300' : 'text-slate-500',
                  )}
                >
                  ${d.value}k
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${h}%` } : { height: 0 }}
                  transition={{ duration: 0.65, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'w-full max-w-[44px] rounded-t-md',
                    isPeak
                      ? 'bg-linear-to-t from-emerald-600 to-emerald-300'
                      : 'bg-linear-to-t from-emerald-700/50 to-emerald-500/70',
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-between gap-3 sm:gap-5">
        {PAYROLL_DATA.map((d, i) => (
          <div key={d.month} className="flex-1 text-center">
            <p className={cn('text-xs', i === peakIdx ? 'font-semibold text-slate-300' : 'text-slate-600')}>
              {d.month}
            </p>
            <p className="text-[10px] text-slate-700">{d.runs} runs</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat counter ──────────────────────────────────────────────────────────────

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, display } = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="font-mono text-4xl font-bold tracking-tight text-white">
        <span ref={ref}>{display.toLocaleString()}</span>
        <span className="text-emerald-400">{suffix}</span>
      </p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────

// Stable values — Math.random() in render causes churn on every re-render
const FEATURE_TALL_VALUES: Record<string, string> = {
  'Gross Pay': '$7,200',
  'Net Pay': '$6,000',
  'Tax': '12%',
  'Benefits': '$320',
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
  tall?: boolean;
  wide?: boolean;
  animDelay?: number;
}

function FeatureCard({ icon: Icon, title, description, highlight, tall, wide, animDelay = 0 }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      custom={animDelay}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-6 transition-colors duration-300',
        highlight
          ? 'border-emerald-500/40 bg-linear-to-br from-emerald-950/60 via-slate-900/80 to-slate-900/60'
          : 'border-slate-700/50 bg-slate-900/60 hover:border-slate-600/70',
        tall && 'row-span-2',
        wide && 'md:col-span-2',
      )}
    >
      {highlight && (
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-linear-to-br from-emerald-500/20 via-transparent to-transparent opacity-60" />
      )}

      <div
        className={cn(
          'mb-4 inline-flex items-center justify-center rounded-xl p-2.5 transition-colors duration-300',
          highlight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400',
        )}
      >
        <Icon size={22} strokeWidth={1.5} />
      </div>

      <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>

      {tall && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {(['Gross Pay', 'Net Pay', 'Tax', 'Benefits'] as const).map((label) => (
            <div key={label} className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-white">
                {FEATURE_TALL_VALUES[label]}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-slate-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium text-slate-100 sm:text-base">{q}</span>
        <span
          className="shrink-0 text-slate-500 transition-transform duration-25"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
        >
          <ChevronDown size={18} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-slate-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Testimonial card ──────────────────────────────────────────────────────────
// Removed backdrop-blur-sm — having 10 blurred elements inside a continuously
// animating marquee is one of the biggest performance killers on this page.
function TestimonialCard({
  quote, name, title, company,
}: {
  quote: string; name: string; title: string; company: string;
}) {
  return (
    <div className="flex w-80 shrink-0 flex-col gap-4 rounded-2xl border border-slate-700/60 bg-slate-900 p-6 md:w-96">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-amber-400">★</span>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-slate-300">"{quote}"</p>
      <div className="mt-auto flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-slate-500">{title} · {company}</p>
        </div>
      </div>
    </div>
  );
}

// ── Pricing card ──────────────────────────────────────────────────────────────

function PricingCard({
  plan, price, period, features, cta, highlighted, badge,
}: {
  plan: string; price: string; period: string; features: string[]; cta: string; highlighted?: boolean; badge?: string;
}) {
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-7',
        highlighted
          ? 'border-emerald-500/60 bg-linear-to-b from-emerald-950/70 to-slate-900/80'
          : 'border-slate-700/50 bg-slate-900/60',
      )}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-400">
          {badge}
        </span>
      )}
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">{plan}</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="mb-1 text-sm text-slate-500">{period}</span>
      </div>
      <ul className="mt-6 flex flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate(ROUTES.REGISTER)}
        className={cn(
          'mt-8 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200',
          highlighted
            ? 'bg-emerald-500 text-white hover:bg-emerald-400'
            : 'border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white',
        )}
      >
        {cta}
      </button>
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────────

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-3"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-lg font-bold text-emerald-400">
        {num}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
    </motion.div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled((prev) => {
          const next = window.scrollY > 20;
          return prev === next ? prev : next;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ];

  function scrollTo(id: string) {
    document.getElementById(id.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  }

  function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const features: FeatureCardProps[] = [
    {
      icon: FileText,
      title: 'Smart Invoice Designer',
      description: 'Build pixel-perfect invoices with our drag-and-drop designer. Four beautiful themes, custom branding, PDF generation.',
      highlight: true,
      tall: true,
      animDelay: 0,
    },
    {
      icon: Users,
      title: 'Team Payroll — Multi-department',
      description: 'Process payroll for every department simultaneously. Salary structures, allowances, deductions and tax slabs — automated.',
      animDelay: 1,
    },
    {
      icon: BarChart3,
      title: 'Live Financial Dashboard',
      description: 'Cash-flow, revenue trends, AR aging and payroll timelines. Every number you need, exactly when you need it.',
      animDelay: 2,
    },
    {
      icon: DollarSign,
      title: 'AR & Client Management',
      description: 'Track outstanding balances, send automated reminders and record partial payments. Never chase an invoice manually again.',
      wide: true,
      animDelay: 3,
    },
    {
      icon: Shield,
      title: 'Role-based Access',
      description: 'Admin, HR, Accountant and Staff roles. Every person sees exactly what they should.',
      animDelay: 4,
    },
    {
      icon: Zap,
      title: 'AI Invoice Assistant',
      description: 'Describe what you need in plain English — the AI drafts line items, terms and suggested amounts in seconds.',
      highlight: true,
      animDelay: 5,
    },
  ];

  const testimonials = [
    { quote: "We replaced three separate tools with PM-Safu. Our accounting team spent 40% less time on month-end close.", name: "Sarah Chen", title: "CFO", company: "Apex Dynamics" },
    { quote: "The payroll module is the cleanest I've used. Salary slips are generated automatically and employees love the transparency.", name: "Marcus Osei", title: "HR Director", company: "BlueWave Consulting" },
    { quote: "Invoice designer is exceptional. Clients comment on how professional our invoices look compared to before.", name: "Priya Mehta", title: "Founder", company: "Solis Creative" },
    { quote: "We onboarded 60 employees in a single afternoon. The setup flow is intuitive and the dashboard gave us instant clarity.", name: "James Liu", title: "COO", company: "Orion Tech" },
    { quote: "AI draft feature saves us 20 minutes per invoice. We send twice as many proposals now without hiring anyone extra.", name: "Nina Hoffman", title: "Head of Sales", company: "PeakSoft" },
  ];

  const faqs = [
    { q: "Does PM-Safu work for teams of all sizes?", a: "Yes. PM-Safu is designed from solo founders up to companies with hundreds of employees. The payroll engine processes runs both synchronously for small teams and via background jobs for larger ones." },
    { q: "How does the multi-department payroll work?", a: "You set up departments, assign salary structures (with base salary, allowances and deductions), then run payroll for all departments at once. Salary slips are generated automatically and employees receive email notifications." },
    { q: "Can I customise my invoices to match my brand?", a: "Absolutely. The invoice designer supports custom colours, logos, four base themes (Classic, Modern, Minimal, Bold), and full control over which columns and sections appear. You can save multiple templates." },
    { q: "What roles are available for team access?", a: "Four roles: Company Admin (full access), HR Manager (people & payroll), Accountant (invoices, clients, reports), and Staff (salary slips and profile only). Each role sees a scoped interface." },
    { q: "Is my data secure?", a: "All data is isolated per company (multi-tenant). Passwords are bcrypt-hashed. Auth uses signed JWTs with refresh token rotation. Rate-limiting is applied to all sensitive endpoints. Uploads are stored outside the web root." },
    { q: "Can I export reports?", a: "Yes. You can export invoices, client lists, employee rosters, payroll summaries and salary slips as Excel or PDF files directly from the dashboard." },
    { q: "What happens when an invoice becomes overdue?", a: "PM-Safu automatically detects overdue invoices and can send payment reminder emails to clients. You can also manually trigger reminders from the invoice detail page." },
    { q: "Is there a free trial?", a: "Yes — register your company and you get full access to all features during our launch period. No credit card required." },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060910] text-slate-100">
      {/*
        CSS keyframes for infinite animations — keeps them on the compositor thread
        instead of driving them via JS/framer-motion every frame.
      */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes float-down {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(8px); }
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'border-b border-slate-800/80 bg-[#060910]/90 backdrop-blur-xl' : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2.5">
            <img src="/logo.webp" alt="PM-Safu" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-base font-semibold tracking-tight text-white">PM-Safu</span>
          </Link>

          <ul className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => scrollTo(l.href)}
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <Link
                to={ROUTES.DASHBOARD}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
              >
                Go to dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to={ROUTES.LOGIN} className="text-sm text-slate-400 transition-colors hover:text-white">
                  Sign in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-slate-400"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-slate-800 bg-[#060910]/95 backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-1 px-5 pb-5 pt-2">
                {navLinks.map((l) => (
                  <button
                    key={l.label}
                    onClick={() => scrollTo(l.href)}
                    className="rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800/60"
                  >
                    {l.label}
                  </button>
                ))}
                <hr className="my-2 border-slate-800" />
                <Link to={ROUTES.LOGIN} className="rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60">
                  Sign in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="rounded-xl bg-emerald-500 px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Get started free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center pt-16">
        {/* Reduced blur radius from blur-[80px] → blur-2xl (24px) */}
        <GlowOrb className="left-[-10%] top-[10%] h-[500px] w-[500px] bg-emerald-500/8" />
        <GlowOrb className="right-[-5%] top-[20%] h-[400px] w-[400px] bg-blue-500/5" />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
          {/* Left — text */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-5"
          >

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]"
            >
              Your financial{' '}
              <span className="relative">
                <span className="relative z-10 bg-linear-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  back-office
                </span>
                <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-linear-to-r from-emerald-500 to-teal-400 opacity-60" />
              </span>
              ,{' '}built for precision.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              Send branded invoices, process multi-department payroll, track outstanding balances
              and generate salary slips — all from one calm, numbers-first workspace.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link
                to={ROUTES.REGISTER}
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
              >
                Start for free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => scrollTo('#how')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
              >
                See how it works
                <ChevronRight size={16} />
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <div className="flex">
                {['#0d7a58', '#0f8c67', '#14926a', '#1aab7a'].map((c, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-[#060910]"
                    style={{ backgroundColor: c, marginLeft: i > 0 ? '-8px' : 0 }}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Trusted by <span className="font-medium text-slate-300">500+</span> growing companies
              </p>
            </motion.div>
          </motion.div>

          {/* Right — Lottie */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl border border-emerald-500/10 bg-linear-to-br from-emerald-950/30 via-transparent to-slate-800/20" />

            {/* CSS-animated floating cards — no JS per-frame cost */}
            <div
              className="absolute -left-8 top-8 z-10 hidden rounded-xl border border-slate-700/60 bg-slate-900/90 px-4 py-3 shadow-xl lg:block"
              style={{ animation: 'float-up 4s ease-in-out infinite' }}
            >
              <p className="text-xs text-slate-500">Monthly revenue</p>
              <p className="font-mono text-base font-bold text-emerald-400">$48,200</p>
            </div>

            <div
              className="absolute -right-6 bottom-12 z-10 hidden rounded-xl border border-slate-700/60 bg-slate-900/90 px-4 py-3 shadow-xl lg:block"
              style={{ animation: 'float-down 3.5s ease-in-out infinite 0.5s' }}
            >
              <p className="text-xs text-slate-500">Payroll processed</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-sm font-semibold text-white">12 employees · $0 errors</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-linear-to-br from-slate-800/60 to-slate-900/80 p-2">
              <HeroLottie />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section id="stats" className="relative border-y border-slate-800/60 py-16">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatCounter value={500} suffix="+" label="companies onboarded" />
            <StatCounter value={24000} suffix="+" label="invoices generated" />
            <StatCounter value={98} suffix="%" label="on-time payroll rate" />
            <StatCounter value={4} suffix="min" label="avg. setup time" />
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ─────────────────────────────────── */}
      <section id="features" className="relative py-24">
        <GlowOrb className="-left-20 top-1/2 h-[350px] w-[350px] bg-emerald-500/5" />

        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-14 flex flex-col items-center gap-4 text-center"
          >
            <motion.div variants={fadeUp}><SectionTag>Features</SectionTag></motion.div>
            <motion.h2 variants={fadeUp} className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to run your finances
            </motion.h2>
            <motion.p variants={fadeUp} className="max-w-xl text-slate-400">
              Built around the actual workflows of growing companies — not a patchwork of features bolted together.
            </motion.p>
          </motion.div>

          <div className="grid auto-rows-auto grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how" className="relative py-24">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-emerald-950/8 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-16 flex flex-col items-center gap-4 text-center"
          >
            <motion.div variants={fadeUp}><SectionTag>How it works</SectionTag></motion.div>
            <motion.h2 variants={fadeUp} className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Up and running in minutes
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
            <StepCard
              num="01"
              title="Register your company"
              desc="Create your workspace, upload your logo and set your brand color. Admins are notified and approve your account — usually within hours."
            />
            <div className="hidden items-center md:flex">
              <div className="h-px flex-1 border-t border-dashed border-slate-700" />
            </div>
            <StepCard
              num="02"
              title="Set up your team"
              desc="Add departments, salary structures and employees. Invite HR, accountants and staff with scoped roles. Everything is live immediately."
            />
            <div className="hidden items-center md:flex">
              <div className="h-px flex-1 border-t border-dashed border-slate-700" />
            </div>
            <StepCard
              num="03"
              title="Send invoices & run payroll"
              desc="Design invoices with your brand, send them to clients and process payroll for your whole team in one click. Salary slips are emailed automatically."
            />
          </div>

          <PayrollChart />
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-12 flex flex-col items-center gap-4 text-center"
          >
            <motion.div variants={fadeUp}><SectionTag>Testimonials</SectionTag></motion.div>
            <motion.h2 variants={fadeUp} className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Teams that run on PM-Safu
            </motion.h2>
          </motion.div>
        </div>

        {/* CSS-driven marquee — no JS per-frame cost, runs on compositor */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-[#060910]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-[#060910]" />
          <div
            className="flex gap-4 py-2"
            style={{
              width: 'max-content',
              animation: 'marquee 30s linear infinite',
              willChange: 'transform',
            }}
          >
            {[...testimonials, ...testimonials].map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS / TRUST BAR ───────────────────────── */}
      <section className="border-y border-slate-800/60 py-12">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-slate-600">Works with</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {['Brevo', 'MongoDB', 'Redis', 'Docker', 'BullMQ', 'PDF Kit'].map((name) => (
              <div key={name} className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-400">
                <Globe size={14} />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section id="pricing" className="relative py-24">
        <GlowOrb className="right-0 top-1/2 h-[400px] w-[400px] bg-emerald-500/5" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-14 flex flex-col items-center gap-4 text-center"
          >
            <motion.div variants={fadeUp}><SectionTag>Pricing</SectionTag></motion.div>
            <motion.h2 variants={fadeUp} className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400">
              No per-feature paywalls. Every plan includes invoicing, payroll, and the AI assistant.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PricingCard
              plan="Starter"
              price="Free"
              period="forever"
              features={[
                'Up to 3 team members',
                '50 invoices / month',
                '1 department',
                'Basic payroll',
                'Email support',
              ]}
              cta="Start for free"
            />
            <PricingCard
              plan="Growth"
              price="$29"
              period="/ month"
              features={[
                'Unlimited team members',
                'Unlimited invoices',
                'Unlimited departments',
                'Full payroll suite',
                'AI invoice assistant',
                'Priority support',
              ]}
              cta="Start free trial"
              highlighted
              badge="Most popular"
            />
            <PricingCard
              plan="Enterprise"
              price="Custom"
              period="contact us"
              features={[
                'Everything in Growth',
                'Dedicated onboarding',
                'Custom domain & branding',
                'SLA guarantee',
                'SSO / SAML',
                '24/7 support',
              ]}
              cta="Talk to sales"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-12 flex flex-col items-center gap-4 text-center"
          >
            <motion.div variants={fadeUp}><SectionTag>FAQ</SectionTag></motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Questions we get asked
            </motion.h2>
          </motion.div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────── */}
      <section id="contact" className="relative py-24">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-emerald-950/8 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-14 flex flex-col items-center gap-4 text-center"
          >
            <motion.div variants={fadeUp}><SectionTag>Contact</SectionTag></motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Let's talk
            </motion.h2>
            <motion.p variants={fadeUp} className="max-w-md text-slate-400">
              Have a question, need a demo or want to discuss enterprise pricing? We're a message away.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex flex-col gap-6"
            >
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8">
                <h3 className="mb-6 text-base font-semibold text-white">Get in touch</h3>
                <div className="flex flex-col gap-5">
                  {[
                    { icon: Mail, label: 'Email', value: 'hello@pmsafu.com' },
                    { icon: Phone, label: 'Phone', value: '+1 (415) 555-0100' },
                    { icon: MapPin, label: 'Office', value: '123 Market St, San Francisco, CA 94105' },
                    { icon: Building2, label: 'Hours', value: 'Mon–Fri 9 am–6 pm PST' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Icon size={15} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-0.5 text-sm text-slate-300">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-linear-to-br from-emerald-950/40 to-slate-900/60 p-6">
                <p className="text-sm font-semibold text-white">Ready to start?</p>
                <p className="mt-1 text-xs text-slate-400">Register in 2 minutes. No credit card required.</p>
                <Link
                  to={ROUTES.REGISTER}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                >
                  Create free account <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-10 text-center">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                  <p className="text-lg font-semibold text-white">Message received!</p>
                  <p className="text-sm text-slate-400">We'll get back to you within one business day.</p>
                </div>
              ) : (
                <form
                  onSubmit={handleContact}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8"
                >
                  <h3 className="mb-2 text-base font-semibold text-white">Send a message</h3>
                  {[
                    { label: 'Your name', key: 'name' as const, type: 'text', placeholder: 'Jane Doe' },
                    { label: 'Work email', key: 'email' as const, type: 'email', placeholder: 'jane@company.com' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
                      <input
                        type={type}
                        required
                        placeholder={placeholder}
                        value={contactForm[key]}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Message</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us what you're looking for…"
                      value={contactForm.message}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                      className="resize-none rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                  >
                    Send message <ArrowRight size={15} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 py-12">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <img src="/logo.webp" alt="PM-Safu" className="h-7 w-7 rounded-lg object-contain" />
              <span className="text-sm font-semibold text-white">PM-Safu</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5">
              {navLinks.map((l) => (
                <button
                  key={l.label}
                  onClick={() => scrollTo(l.href)}
                  className="text-xs text-slate-500 transition-colors hover:text-slate-300"
                >
                  {l.label}
                </button>
              ))}
              <Link to={ROUTES.LOGIN} className="text-xs text-slate-500 transition-colors hover:text-slate-300">Sign in</Link>
              <Link to={ROUTES.REGISTER} className="text-xs text-slate-500 transition-colors hover:text-slate-300">Register</Link>
            </div>

            <p className="text-xs text-slate-600">© {new Date().getFullYear()} PM-Safu</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
