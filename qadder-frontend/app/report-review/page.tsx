"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import Link from "next/link";

type NajmReportData = {
  accident_id?: string;
  accident_date?: string | null;
  accident_time?: string | null;
  accident_coordinates?: string | null;
  fault_percentage?: number | null;
  damage_area?: string | null;
  damage_area_ar?: string | null;
  party_full_name?: string | null;
  license_type?: string | null;
  license_expiry_date?: string | null;
  party_national_id?: string | null;
  party_mobile?: string | null;
  party_nationality?: string | null;
  vehicle_plate_number?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_color?: string | null;
};

type ValidationData = {
  national_id_match?: boolean;
  mobile_match?: boolean;
  nationality_match?: boolean;
  vehicle_brand_match?: boolean;
  vehicle_model_match?: boolean;
  vehicle_year_match?: boolean;
  vehicle_color_match?: boolean;
};

type Step1Result = {
  message?: string;
  case_id?: string;
  case_number?: string;
  status?: string;
  najm_report?: NajmReportData;
  validation?: ValidationData;
};

const steps = [
  "رفع التقرير",
  "رفع الصورة",
  "تحليل الأضرار",
  "حساب التكلفة",
  "التقرير النهائي",
];

export default function ReportReviewPage() {
  const router = useRouter();

  const [step1Data, setStep1Data] = useState<Step1Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("latestNajmStep1");

      if (!stored) {
        setError("لا توجد بيانات تقرير محفوظة. الرجاء رفع التقرير أولًا.");
        setLoading(false);
        return;
      }

      const parsed: Step1Result = JSON.parse(stored);
      setStep1Data(parsed);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل بيانات التقرير"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const validationItems = [
    {
      label: "مطابقة رقم الهوية",
      value: step1Data?.validation?.national_id_match,
    },
    {
      label: "مطابقة رقم الجوال",
      value: step1Data?.validation?.mobile_match,
    },
    {
      label: "مطابقة الجنسية",
      value: step1Data?.validation?.nationality_match,
    },
    {
      label: "مطابقة ماركة المركبة",
      value: step1Data?.validation?.vehicle_brand_match,
    },
    {
      label: "مطابقة موديل المركبة",
      value: step1Data?.validation?.vehicle_model_match,
    },
    {
      label: "مطابقة سنة المركبة",
      value: step1Data?.validation?.vehicle_year_match,
    },
    {
      label: "مطابقة لون المركبة",
      value: step1Data?.validation?.vehicle_color_match,
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-qadder-background text-qadder-dark">
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />
        <section className="mx-auto max-w-5xl px-6 py-16" dir="rtl">
          <div className="rounded-[28px] border border-qadder-border/20 bg-white p-12 text-center shadow-sm">
            جاري تحميل بيانات التقرير...
          </div>
        </section>
      </main>
    );
  }

  if (error || !step1Data) {
    return (
      <main className="min-h-screen bg-qadder-background text-qadder-dark">
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />
        <section className="mx-auto max-w-5xl px-6 py-16" dir="rtl">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-600">
              {error || "تعذر تحميل التقرير"}
            </p>

            <div className="mt-6">
              <Link
                href="/upload-report"
                className="rounded-2xl bg-qadder-primary px-6 py-3 font-semibold text-white transition hover:bg-qadder-dark"
              >
                الرجوع لرفع التقرير
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar
        isLoggedIn={true}
        handleLogout={handleLogout}
        contactHref="#contact"
      />

      <section
        className="relative overflow-hidden border-b border-qadder-border/20"
        dir="rtl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="max-w-4xl text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-qadder-border bg-qadder-light px-4 py-2 text-sm font-semibold text-qadder-primary shadow-sm">
           
              <span>مراجعة التقرير</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              مراجعة بيانات تقرير نجم
            </h1>

            <p className="mt-4 text-base leading-8 text-qadder-dark/70 md:text-lg">
              تم استخراج البيانات من التقرير ومقارنتها تلقائيًا مع معلومات حسابك
              والمركبة المسجلة. راجع النتيجة ثم انتقل للخطوة التالية.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <div className="flex min-w-[850px] items-center gap-3">
              {steps.map((step, index) => {
                const done = index === 0;
                const active = index === 1;

                return (
                  <div key={step} className="flex flex-1 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        done
                          ? "bg-qadder-primary text-white"
                          : active
                          ? "border border-qadder-border bg-white text-qadder-primary"
                          : "bg-white text-qadder-dark/50"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-[120px]">
                      <p
                        className={`text-sm font-semibold ${
                          active || done
                            ? "text-qadder-dark"
                            : "text-qadder-dark/45"
                        }`}
                      >
                        {step}
                      </p>
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 ${
                          done ? "bg-qadder-primary/40" : "bg-qadder-border/40"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10" dir="rtl">
        <div className="mb-6 flex flex-wrap gap-3">
    

   
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center justify-between">
             

              <h2 className="text-right text-2xl font-bold text-qadder-dark">
                بيانات التقرير المستخرجة
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoCard
                label="رقم الحالة"
                value={step1Data.case_number || "غير متوفر"}
              />
              <InfoCard
                label="رقم الحادث"
                value={step1Data.najm_report?.accident_id || "غير متوفر"}
              />
              <InfoCard
                label="تاريخ الحادث"
                value={step1Data.najm_report?.accident_date || "غير متوفر"}
              />
              <InfoCard
                label="وقت الحادث"
                value={step1Data.najm_report?.accident_time || "غير متوفر"}
              />
              <InfoCard
                label="إحداثيات الحادث"
                value={
                  step1Data.najm_report?.accident_coordinates || "غير متوفر"
                }
              />
              <InfoCard
                label="نسبة الخطأ"
                value={
                  step1Data.najm_report?.fault_percentage !== null &&
                  step1Data.najm_report?.fault_percentage !== undefined
                    ? `${step1Data.najm_report.fault_percentage}%`
                    : "غير متوفرة"
                }
              />
              <InfoCard
                label="منطقة الضرر"
                value={step1Data.najm_report?.damage_area_ar || "غير متوفرة"}
              />
              <InfoCard
                label="اسم الطرف"
                value={step1Data.najm_report?.party_full_name || "غير متوفر"}
              />
              <InfoCard
                label="نوع الرخصة"
                value={step1Data.najm_report?.license_type || "غير متوفر"}
              />
              <InfoCard
                label="انتهاء الرخصة"
                value={
                  step1Data.najm_report?.license_expiry_date || "غير متوفر"
                }
              />
              <InfoCard
                label="رقم الهوية"
                value={
                  step1Data.najm_report?.party_national_id || "غير متوفر"
                }
              />
              <InfoCard
                label="رقم الجوال"
                value={step1Data.najm_report?.party_mobile || "غير متوفر"}
              />
              <InfoCard
                label="الجنسية"
                value={
                  step1Data.najm_report?.party_nationality || "غير متوفرة"
                }
              />
              <InfoCard
                label="رقم اللوحة"
                value={
                  step1Data.najm_report?.vehicle_plate_number || "غير متوفر"
                }
              />
              <InfoCard
                label="ماركة المركبة"
                value={step1Data.najm_report?.vehicle_brand || "غير متوفرة"}
              />
              <InfoCard
                label="موديل المركبة"
                value={step1Data.najm_report?.vehicle_model || "غير متوفر"}
              />
              <InfoCard
                label="سنة المركبة"
                value={
                  step1Data.najm_report?.vehicle_year
                    ? String(step1Data.najm_report.vehicle_year)
                    : "غير متوفرة"
                }
              />
              <InfoCard
                label="لون المركبة"
                value={step1Data.najm_report?.vehicle_color || "غير متوفر"}
              />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-4 text-right text-2xl font-bold text-qadder-dark">
                نتيجة المطابقة
              </h2>

              <div className="space-y-3">
                {validationItems.map((item) => (
                  <ValidationRow
                    key={item.label}
                    label={item.label}
                    matched={item.value}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-4 text-right text-xl font-bold text-qadder-dark">
                الخطوة التالية
              </h2>

              <p className="text-right text-sm leading-7 text-qadder-dark/70">
                إذا كانت البيانات صحيحة، يمكنك المتابعة إلى خطوة رفع صور الأضرار
                حتى يبدأ النظام بتحليلها.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/upload-damage-images")}
                  className="rounded-2xl bg-qadder-primary px-5 py-3 text-center font-semibold text-white transition hover:bg-qadder-dark"
                >
                  التالي: رفع الصور
                </button>

                
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-qadder-primary py-16 text-white" dir="rtl">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h3 className="text-2xl font-bold md:text-3xl">تواصل معنا</h3>
          <p className="mt-4 text-white/80">
            📧{" "}
            <a href="mailto:support@qadder.com" className="hover:text-white">
              support@qadder.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-qadder-background/50 p-4 text-right">
      <p className="text-xs font-semibold text-qadder-dark/50">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-qadder-dark">
        {value}
      </p>
    </div>
  );
}

function ValidationRow({
  label,
  matched,
}: {
  label: string;
  matched?: boolean;
}) {
  let statusText = "غير متوفر";
  let statusClass =
    "border-qadder-border/20 bg-qadder-background/40 text-qadder-dark/70";

  if (matched === true) {
    statusText = "مطابق";
    statusClass = "border-green-200 bg-green-50 text-green-700";
  } else if (matched === false) {
    statusText = "غير مطابق";
    statusClass = "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-qadder-border/15 bg-qadder-background/40 p-4">
      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass}`}>
        {statusText}
      </span>

      <p className="text-right text-sm font-semibold text-qadder-dark">
        {label}
      </p>
    </div>
  );
}