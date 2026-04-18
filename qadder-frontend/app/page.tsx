"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import ContactUs from "@/components/ContactUs";


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
      <main className="min-h-screen bg-qadder-background text-qadder-dark" >
        <AppNavbar
          isLoggedIn={true}
          handleLogout={handleLogout}
          contactHref="#contact"
        />

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

            <a href="/upload-report">
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
              <ContactUs />

      </main>
    );

  }


  return (

    <main className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar
        isLoggedIn={false}
        contactHref="#contact"
      />

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
      <ContactUs/>
    </main>
  );
}