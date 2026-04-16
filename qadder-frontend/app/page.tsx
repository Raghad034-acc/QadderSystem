"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import Link from "next/link";

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


export default function HomePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
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
  if (user) {
    return (
      <main className="min-h-screen bg-qadder-background text-qadder-dark">
        <header className="sticky top-0 z-50 border-b border-qadder-border/30 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-1">
              <img
                src="/images/logo.png"
                alt="شعار قدر"
                className="h-11 w-auto"
              />
            </div>

            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col gap-1"
            >
              <span className="block h-0.5 w-6 bg-qadder-dark"></span>
              <span className="block h-0.5 w-6 bg-qadder-dark"></span>
              <span className="block h-0.5 w-6 bg-qadder-dark"></span>
            </button>

          </div>
        </header>
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40">

            {/* Menu Panel */}
            <div className="absolute right-0 top-0 h-full w-64 bg-white p-6 shadow-xl">

              {/* Close Button */}
              <button
                onClick={() => setMenuOpen(false)}
                className="mb-6 text-xl"
              >
                ✕
              </button>

              {/* Links */}
              <div className="flex flex-col gap-4 text-right">
                <a href="/" className="text-qadder-dark font-medium">الرئيسية</a>
                <a href="/about" className="text-qadder-dark font-medium">حسابي</a>
                <a href="/vehicles" className="text-qadder-dark font-medium">مركباتي</a>
                <a href="/about" className="text-qadder-dark font-medium">عن قدر</a>
                <a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="text-qadder-dark font-medium"
                >
                  تواصل معنا
                </a>
                <button
                  onClick={handleLogout}
                  className="mt-4 block rounded-xl bg-qadder-logout py-3 text-center text-white"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
            {user && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-qadder-border bg-white/80 px-4 py-2 text-sm font-semibold text-qadder-dark shadow-sm backdrop-blur">
                <span>👋</span>
                <span>
                  أهلًا {user.first_name || "بك"}، سعيدون بعودتك
                </span>
              </div>
            )}

            <img
              src="/images/logo.png"
              alt="شعار قدر"
              className="h-50 w-200 object-contain"
            />
            <div className="mb-6 rounded-full border border-qadder-border bg-qadder-light px-4 py-2 text-xs font-semibold text-qadder-primary shadow-sm">
              الخيار الذكي لتقدير أضرار المركبات في المملكة
            </div>

            <h2 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-qadder-dark md:text-6xl">
              قدّر أضرار مركبتك
              <span className="block text-qadder-primary">بسهولة ودقة</span>
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-qadder-dark/70 md:text-lg">
              تجربة رقمية ذكية لتقييم أضرار المركبات بسرعة ودقة،
              مما يساعدك على تقليل الجهد والحصول على تقدير إصلاح أكثر وضوحًا واتساقًا.
            </p>

            <a href="/">
              <button className="mt-6 rounded-2xl bg-qadder-primary px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-qadder-primary/20 transition hover:bg-qadder-dark">          ابدأ التقدير الآن
              </button>
            </a>

            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 justify-items-center">
              <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">

                <svg
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
                >
                  <path
                    transform="translate(100 100)"
                    d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                  />
                </svg>

                <div className="z-20 flex flex-col items-center justify-center text-center">

                  <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                    <CountUp
                      end={user?.vehicles?.length ?? 0}
                      duration={1.5}
                    />
                  </span>

                  <p className="mt-1 text-sm font-semibold text-qadder-dark/70">
                    عدد المركبات
                  </p>

                </div>
              </div>
              <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
                <svg
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none absolute z-10 fill-qadder-light blur-xl transition duration-500 group-hover:scale-105 group-hover:blur-none"
                >
                  <path
                    transform="translate(100 100)"
                    d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                  />
                </svg>

                <div className="z-20 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                    <CountUp end={user?.reports_count ?? 0} duration={1.5} />
                  </span>

                  <p className="mt-1 text-sm font-semibold text-qadder-dark/70">
                    عدد التقارير
                  </p>
                </div>
              </div>


              <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
                <svg
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
                >
                  <path
                    transform="translate(100 100)"
                    d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                  />
                </svg>

                <div className="z-20 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                    <CountUp end={10} duration={2} />
                  </span>
                  <p className="mt-1 text-sm font-semibold text-qadder-dark/70">دقائق للتقدير</p>
                </div>
              </div>

              <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
                <svg
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
                >
                  <path
                    transform="translate(100 100)"
                    d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                  />
                </svg>

                <div className="z-20 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                    <CountUp end={95} duration={2} />%
                  </span>
                  <p className="mt-1 text-sm font-semibold text-qadder-dark/70">دقة التحليل</p>
                </div>
              </div>

              <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
                <svg
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
                >
                  <path
                    transform="translate(100 100)"
                    d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                  />
                </svg>

                <div className="z-20 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                    <CountUp end={100} duration={2} />%
                  </span>
                  <p className="mt-1 text-sm font-semibold text-qadder-dark/70">تقارير واضحة</p>
                </div>
              </div>

              <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
                <svg
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
                >
                  <path
                    transform="translate(100 100)"
                    d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                  />
                </svg>

                <div className="z-20 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                    24/7
                  </span>
                  <p className="mt-1 text-sm font-semibold text-qadder-dark/70">خدمة مستمرة</p>
                </div>
              </div>
            </div>

            <div className="mt-16 grid w-full max-w-6xl gap-6 rounded-[28px] border border-qadder-border/30 bg-white p-6 shadow-[0_20px_60px_rgba(16,47,21,0.08)] md:grid-cols-3 md:p-8">
              <div className="rounded-3xl border border-qadder-border/20 bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-light text-2xl">
                  🗎
                </div>
                <h3 className="text-xl font-bold text-qadder-dark">
                  رفع التقرير
                </h3>
                <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
                  ارفع تقرير نجم لبدء عملية التقدير بشكل منظم
                  وسريع.
                </p>
              </div>

              <div className="rounded-3xl border border-qadder-border/20 bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-light text-2xl">
                  ⛶
                </div>
                <h3 className="text-xl font-bold text-qadder-dark">
                  تصوير الأضرار
                </h3>
                <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
                  التقط صورة واضحة للجزء المتضرر حتى يتمكن النظام من تحليل نوع
                  الضرر ودرجته بدقة.
                </p>
              </div>

              <div className="rounded-3xl border border-qadder-border/20 bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-light text-2xl">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-qadder-dark">
                  الحصول على التقدير
                </h3>
                <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
                  استلم ملخصًا منظمًا للأضرار وتقديرًا لتكلفة الإصلاح ضمن تجربة
                  سريعة وسهلة الاستخدام.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="contact" className="bg-qadder-primary py-16 text-white">
          <div className="mx-auto max-w-6xl px-6 text-center">

            {/* Title */}
            <h3 className="text-2xl font-bold md:text-3xl">
              تواصل معنا
            </h3>

            {/* Email */}
            <p className="mt-4 text-white/80">
              📧{" "}
              <a href="mailto:support@qadder.com" className="hover:text-white">
                support@qadder.com
              </a>
            </p>

            <ul className="mt-8 flex items-center justify-center gap-4">
              <li>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    />
                  </svg>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    />
                  </svg>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>
    );

  }


  return (
    <main className="min-h-screen bg-qadder-background text-qadder-dark">
      <header className="sticky top-0 z-50 border-b border-qadder-border/30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-1">
            <img
              src="/images/logo.png"
              alt="شعار قدر"
              className="h-11 w-auto"
            />
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-1"
          >
            <span className="block h-0.5 w-6 bg-qadder-dark"></span>
            <span className="block h-0.5 w-6 bg-qadder-dark"></span>
            <span className="block h-0.5 w-6 bg-qadder-dark"></span>
          </button>

        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">

          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-64 bg-white p-6 shadow-xl">

            {/* Close Button */}
            <button
              onClick={() => setMenuOpen(false)}
              className="mb-6 text-xl"
            >
              ✕
            </button>

            {/* Links */}
            <div className="flex flex-col gap-4 text-right">
              <a href="/" className="text-qadder-dark font-medium">الرئيسية</a>
              <a href="/" className="text-qadder-dark font-medium">عن قدر</a>
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="text-qadder-dark font-medium"
              >
                تواصل معنا
              </a>
              <a
                href="/login"
                className="mt-4 block rounded-xl bg-qadder-primary py-3 text-center text-white"
              >
                تسجيل الدخول
              </a>
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
          <div className="mb-6 rounded-full border border-qadder-border bg-qadder-light px-4 py-2 text-xs font-semibold text-qadder-primary shadow-sm">
            الخيار الذكي لتقدير أضرار المركبات في المملكة
          </div>

          <img
            src="/images/logo.png"
            alt="شعار قدر"
            className="h-50 w-200 object-contain"
          />

          <h2 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-qadder-dark md:text-6xl">
            قدّر أضرار مركبتك
            <span className="block text-qadder-primary">بسهولة ودقة</span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-8 text-qadder-dark/70 md:text-lg">
            تجربة رقمية ذكية لتقييم أضرار المركبات بسرعة ودقة،
            مما يساعدك على تقليل الجهد والحصول على تقدير إصلاح أكثر وضوحًا واتساقًا.
          </p>
          <a href="/login">
            <button className="mt-6 rounded-2xl bg-qadder-primary px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-qadder-primary/20 transition hover:bg-qadder-dark">          ابدأ التقدير الآن
            </button>
          </a>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 justify-items-center">
            <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
              >
                <path
                  transform="translate(100 100)"
                  d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                />
              </svg>

              <div className="z-20 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                  <CountUp end={10} duration={2} />
                </span>
                <p className="mt-1 text-sm font-semibold text-qadder-dark/70">دقائق للتقدير</p>
              </div>
            </div>

            <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
              >
                <path
                  transform="translate(100 100)"
                  d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                />
              </svg>

              <div className="z-20 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                  <CountUp end={95} duration={2} />%
                </span>
                <p className="mt-1 text-sm font-semibold text-qadder-dark/70">دقة التحليل</p>
              </div>
            </div>

            <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
              >
                <path
                  transform="translate(100 100)"
                  d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                />
              </svg>

              <div className="z-20 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                  <CountUp end={100} duration={2} />%
                </span>
                <p className="mt-1 text-sm font-semibold text-qadder-dark/70">تقارير واضحة</p>
              </div>
            </div>

            <div className="group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white text-qadder-dark shadow-md transition duration-500 hover:-translate-y-2">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute z-10 fill-qadder-light blur-xl duration-500 group-hover:scale-105 group-hover:blur-none"
              >
                <path
                  transform="translate(100 100)"
                  d="M39.5,-49.6C54.8,-43.2,73.2,-36.5,78.2,-24.6C83.2,-12.7,74.8,4.4,69,22.5C63.3,40.6,60.2,59.6,49.1,64.8C38.1,70,19,61.5,0.6,60.7C-17.9,59.9,-35.9,67,-47.2,61.9C-58.6,56.7,-63.4,39.5,-70,22.1C-76.6,4.7,-84.9,-12.8,-81.9,-28.1C-79,-43.3,-64.6,-56.3,-49.1,-62.5C-33.6,-68.8,-16.8,-68.3,-2.3,-65.1C12.1,-61.9,24.2,-55.9,39.5,-49.6Z"
                />
              </svg>

              <div className="z-20 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-qadder-primary" dir="ltr">
                  24/7
                </span>
                <p className="mt-1 text-sm font-semibold text-qadder-dark/70">خدمة مستمرة</p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid w-full max-w-6xl gap-6 rounded-[28px] border border-qadder-border/30 bg-white p-6 shadow-[0_20px_60px_rgba(16,47,21,0.08)] md:grid-cols-3 md:p-8">
            <div className="rounded-3xl border border-qadder-border/20 bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-light text-2xl">
                🗎
              </div>
              <h3 className="text-xl font-bold text-qadder-dark">
                رفع التقرير
              </h3>
              <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
                ارفع تقرير نجم لبدء عملية التقدير بشكل منظم
                وسريع.
              </p>
            </div>

            <div className="rounded-3xl border border-qadder-border/20 bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-light text-2xl">
                ⛶
              </div>
              <h3 className="text-xl font-bold text-qadder-dark">
                تصوير الأضرار
              </h3>
              <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
                التقط صورة واضحة للجزء المتضرر حتى يتمكن النظام من تحليل نوع
                الضرر ودرجته بدقة.
              </p>
            </div>

            <div className="rounded-3xl border border-qadder-border/20 bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-light text-2xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-qadder-dark">
                الحصول على التقدير
              </h3>
              <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
                استلم ملخصًا منظمًا للأضرار وتقديرًا لتكلفة الإصلاح ضمن تجربة
                سريعة وسهلة الاستخدام.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="contact" className="bg-qadder-primary py-16 text-white">
        <div className="mx-auto max-w-6xl px-6 text-center">

          {/* Title */}
          <h3 className="text-2xl font-bold md:text-3xl">
            تواصل معنا
          </h3>

          {/* Email */}
          <p className="mt-4 text-white/80">
            📧{" "}
            <a href="mailto:support@qadder.com" className="hover:text-white">
              support@qadder.com
            </a>
          </p>

          <ul className="mt-8 flex items-center justify-center gap-4">
            <li>
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  />
                </svg>
              </a>
            </li>

            <li>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  />
                </svg>
              </a>
            </li>

            <li>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}