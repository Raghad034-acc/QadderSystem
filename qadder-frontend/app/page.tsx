"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import AppNavbar from "@/components/AppNavbar";
import ContactUs from "@/components/ContactUs";
import {
  CarFront,
  FileText,
  Clock3,
  ShieldCheck,
  Sparkles,
  Camera,
  BadgeCheck,
} from "lucide-react";

type StoredUser = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  brand?: string;
  model?: string;
  year?: number | string;
  vehicles?: Vehicle[];
  reports_count?: number;
};

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plate_number: string;
};

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  delay?: number;
};

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
};

// Reusable stat card with entrance animation
function StatCard({ title, value, icon, delay = 0 }: StatCardProps) {
  return (
    <div
      className="group animate-card-in relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/90 text-qadder-dark shadow-md backdrop-blur-sm transition duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-qadder-primary/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Soft gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-qadder-light/30 opacity-90" />

      {/* Decorative blob */}
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute z-10 fill-qadder-light blur-xl transition duration-500 group-hover:scale-110 group-hover:blur-none"
      >
        <path
          transform="translate(100 100)"
          d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
        />
      </svg>

      {/* Icon wrapper */}
      <div className="relative z-20 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-qadder-light text-qadder-primary shadow-sm transition duration-300 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>

      {/* Card content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center">
        <span
          className="text-4xl font-extrabold text-qadder-primary"
          dir="ltr"
        >
          {value}
        </span>
        <p className="mt-1 text-sm font-semibold text-qadder-dark/70">
          {title}
        </p>
      </div>
    </div>
  );
}

// Reusable feature card section
function FeatureCard({
  title,
  description,
  icon,
  delay = 0,
}: FeatureCardProps) {
  return (
    <div
      className="animate-card-in group rounded-3xl border border-qadder-border/20 bg-white p-8 text-center shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-qadder-primary/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-light text-qadder-primary transition duration-300 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-qadder-dark">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
        {description}
      </p>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance transitions after mount
    setMounted(true);

    // Read saved user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  // Stats shown for logged-in users
  const statsLoggedIn = [
    {
      title: "عدد المركبات",
      value: <CountUp end={user?.vehicles?.length ?? 0} duration={1.5} />,
      icon: <CarFront size={24} />,
    },
    {
      title: "عدد التقارير",
      value: <CountUp end={user?.reports_count ?? 0} duration={1.5} />,
      icon: <FileText size={24} />,
    },
    {
      title: "دقائق للتقدير",
      value: <CountUp end={10} duration={2} />,
      icon: <Clock3 size={24} />,
    },
    {
      title: "دقة التحليل",
      value: (
        <>
          <CountUp end={95} duration={2} />%
        </>
      ),
      icon: <ShieldCheck size={24} />,
    },
    {
      title: "تقارير واضحة",
      value: (
        <>
          <CountUp end={100} duration={2} />%
        </>
      ),
      icon: <BadgeCheck size={24} />,
    },
    {
      title: "خدمة مستمرة",
      value: "24/7",
      icon: <Sparkles size={24} />,
    },
  ];

  // Stats shown for guests
  const statsGuest = [
    {
      title: "دقائق للتقدير",
      value: <CountUp end={10} duration={2} />,
      icon: <Clock3 size={24} />,
    },
    {
      title: "دقة التحليل",
      value: (
        <>
          <CountUp end={95} duration={2} />%
        </>
      ),
      icon: <ShieldCheck size={24} />,
    },
    {
      title: "تقارير واضحة",
      value: (
        <>
          <CountUp end={100} duration={2} />%
        </>
      ),
      icon: <BadgeCheck size={24} />,
    },
    {
      title: "خدمة مستمرة",
      value: "24/7",
      icon: <Sparkles size={24} />,
    },
  ];

  // Feature cards content
  const featureCards = [
    {
      title: "رفع التقرير",
      description: "ارفع تقرير نجم لبدء عملية التقدير بشكل منظم وسريع",
      icon: <FileText size={24} />,
    },
    {
      title: "تصوير الضرر",
      description:
        "ارفع صورة واضحة للجزء المتضرر حتى يتمكن النظام من تحليل نوع الضرر وشدته بدقة",
      icon: <Camera size={24} />,
    },
    {
      title: "الحصول على التقرير",
      description: "استلم تقريرًا واضحًا للأضرار وتكلفة الإصلاح خلال دقائق",
      icon: <BadgeCheck size={24} />,
    },
  ];

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-qadder-background text-qadder-dark"
      >
        <AppNavbar
          isLoggedIn={!!user}
          handleLogout={user ? handleLogout : undefined}
          contactHref="#contact"
        />

        <section className="relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />
          <div className="absolute -right-20 top-16 h-56 w-56 rounded-full bg-qadder-primary/10 blur-3xl" />
          <div className="absolute -left-16 bottom-16 h-52 w-52 rounded-full bg-qadder-light blur-3xl" />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
            {/* Welcome badge for returning users */}
            {user && (
              <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-qadder-border bg-white/80 px-4 py-2 text-sm font-semibold text-qadder-dark shadow-sm backdrop-blur">   
                <span>الحمدلله على السلامة {user.first_name || ""}، جاهزين نخدمك</span>
                <Sparkles size={16} className="text-qadder-primary" />
              </div>
            )}

            {/* Logo */}
            <img
              src="/images/logo.png"
              alt="شعار قدر"
              className={`h-50 w-200 object-contain transition duration-700 ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            />

            {/* Hero title */}
            <h2
              className={`max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-qadder-dark transition duration-700 md:text-6xl ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              قدّر أضرار مركبتك
              <span className="block text-qadder-primary">بسهولة ودقة</span>
            </h2>

            {/* Hero subtitle */}
            <p
              className={`mt-5 max-w-2xl text-base leading-8 text-qadder-dark/70 transition duration-700 md:text-lg ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: "120ms" }}
            >
              حل رقمي متكامل لتقدير أضرار المركبات في المملكة خلال دقائق
            </p>

            {/* Main CTA */}
            <a
              href={user ? "/upload-report" : "/login"}
              className="mt-8 block"
            >
              <button
                className={`group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-qadder-primary/20 transition duration-300 hover:-translate-y-1 hover:bg-qadder-dark ${
                  mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
                style={{ transitionDelay: "180ms" }}
              >
                 ابدأ التقدير الآن               
              </button>
            </a>

            {/* Stats section */}
            <div className="mt-12 grid grid-cols-2 gap-4 justify-items-center md:grid-cols-4">
              {(user ? statsLoggedIn : statsGuest).map((stat, index) => (
                <StatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  delay={150 + index * 90}
                />
              ))}
            </div>

            {/* Features section */}
            <div className="mt-16 grid w-full max-w-6xl gap-6 rounded-[28px] border border-qadder-border/30 bg-white/90 p-6 shadow-[0_20px_60px_rgba(16,47,21,0.08)] backdrop-blur md:grid-cols-3 md:p-8">
              {featureCards.map((card, index) => (
                <FeatureCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  delay={250 + index * 100}
                />
              ))}
            </div>
          </div>
        </section>

        <ContactUs />
      </main>

      <style jsx>{`
        /* Card entrance animation */
        .animate-card-in {
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          animation: cardIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* Welcome badge fade-up */
        .animate-fade-up {
          animation: fadeUp 0.9s ease forwards;
        }

        @keyframes cardIn {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.98) rotate(0deg);
          }
          45% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(-0.5deg);
          }
          65% {
            transform: translateY(0) scale(1) rotate(0.4deg);
          }
          80% {
            transform: translateY(0) scale(1) rotate(-0.2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}