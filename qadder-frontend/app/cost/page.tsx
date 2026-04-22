"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import ContactUs from "@/components/ContactUs";
import PageLoader from "@/components/PageLoader";
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";

// Backend base URL
const BACKEND_URL = "http://127.0.0.1:8000";

// Type for each damage row returned from step 7
type Step7Row = {
  damage_id: string;
  damage_no?: number;
  damage_type_en?: string;
  damage_type_ar?: string;
  severity_en?: string;
  severity_ar?: string;
  part_name_en?: string;
  part_name_ar?: string;
  part_price?: number;
  labor_cost?: number;
  subtotal_before_fault?: number;
  subtotal_after_fault?: number;
  match_debug?: unknown;
};

// Type for cost summary returned from step 7
type Step7Summary = {
  fault_percentage?: number;
  fault_multiplier?: number;
  damages_count?: number;
  total_parts?: number;
  total_labor?: number;
  total_estimated_cost?: number;
  adjusted_cost?: number;
};

// Type for full step 7 response
type Step7Response = {
  message?: string;
  case_id?: string;
  status?: string;
  vehicle?: {
    brand?: string;
    model?: string;
    year?: number | string;
  };
  vehicle_filter_debug?: unknown;
  summary?: Step7Summary;
  rows?: Step7Row[];
  detail?: string;
};

// Format number as SAR currency
function formatCurrency(value?: number) {
  const safe = Number(value || 0);
  return `${safe.toFixed(2)} ريال`;
}

// Return style classes based on severity value
function severityBadgeClass(severity: string) {
  const value = severity.trim().toLowerCase();

  if (value === "high" || value === "مرتفع") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "medium" || value === "متوسط") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-green-50 text-green-700 border-green-200";
}

export default function CostPage() {
  // Router and query params hooks
  const router = useRouter();
  const params = useSearchParams();
  const startedRef = useRef(false);

  // Read values from URL params
  const caseId = params.get("case_id") || "";
  const imagePath = params.get("image") || "";

  // Page state
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [step7Response, setStep7Response] = useState<Step7Response | null>(null);

  // Progress steps labels
  const steps = ["رفع التقرير", "رفع الصورة", "تحليل الأضرار", "حساب التكلفة", "التقرير النهائي"];

  // Build full image URL from backend path
  const imageUrl = useMemo(() => {
    if (!imagePath) return "";
    return `${BACKEND_URL}/${decodeURIComponent(imagePath).replace(/\\/g, "/")}`;
  }, [imagePath]);

  // Extract rows and summary from response
  const rows = step7Response?.rows || [];
  const summary = step7Response?.summary;

  // Run pricing request once on page load
  useEffect(() => {
    if (!caseId) {
      setPageError("معرّف الحالة غير موجود. الرجاء العودة والمحاولة مرة أخرى.");
      setPageLoading(false);
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    const runPricing = async () => {
      try {
        setPageError("");
        setPageLoading(true);

        const res = await fetch(`${BACKEND_URL}/step7/${caseId}`, {
          method: "POST",
        });

        const data: Step7Response = await res.json();
        setStep7Response(data);

        if (!res.ok) {
          throw new Error(data.detail || "فشل في حساب تكلفة الإصلاح.");
        }
      } catch (error) {
        console.error(error);
        setPageError(
          error instanceof Error ? error.message : "حدث خطأ أثناء حساب تكلفة الإصلاح."
        );
      } finally {
        setPageLoading(false);
      }
    };

    runPricing();
  }, [caseId]);

  // Navigate back to analysis page
  const goPrevious = () => {
    router.push(`/analysis?case_id=${caseId}`);
  };

  // Navigate to final report page
  const goNext = () => {
  router.push(
    `/qadder-report?case_id=${caseId}&image=${encodeURIComponent(imagePath || "")}`
  );
};

  return (
    <main dir="rtl" className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar isLoggedIn={true} />

      {/* Header and progress section */}
      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-8">
          {/* Progress steps */}
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto flex min-w-[860px] items-start justify-between gap-2 md:min-w-0">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const done = stepNumber < 4;
                const active = stepNumber === 4;

                return (
                  <div key={step} className="flex flex-1 items-start">
                    <div className="flex flex-1 flex-col items-center text-center">
                      {/* Step circle */}
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition ${
                          done
                            ? "border-qadder-primary bg-qadder-primary text-white"
                            : active
                            ? "border-qadder-primary bg-white text-qadder-primary ring-4 ring-qadder-secondary/25"
                            : "border border-qadder-border/40 bg-white text-qadder-dark/55"
                        }`}
                      >
                        {done ? <Check size={18} /> : stepNumber}
                      </div>

                      {/* Step label */}
                      <p
                        className={`mt-3 text-xs leading-6 md:text-sm ${
                          active
                            ? "font-bold text-qadder-dark"
                            : "font-medium text-qadder-dark/65"
                        }`}
                      >
                        {step}
                      </p>
                    </div>

                    {/* Connector line between steps */}
                    {index !== steps.length - 1 && (
                      <div className="mt-6 h-[2px] flex-1 rounded-full bg-qadder-border/30">
                        <div
                          className={`h-full rounded-full ${
                            done ? "bg-qadder-primary" : "bg-transparent"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page title */}
          <div className="mt-5 text-right">
            <h1 className="text-2xl font-bold md:text-4xl">
              نتائج تكلفة الإصلاح
            </h1>
          </div>
        </div>
      </section>

      {/* Main content section */}
      <section className="mx-auto max-w-4xl px-6 py-6 md:py-8">
        {pageLoading ? (
          <div className="rounded-[28px] border border-qadder-border/30 bg-white p-8">
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-6 text-center">
              <PageLoader text="جاري حساب تكلفة الإصلاح..." />
            </div>
          </div>
        ) : pageError ? (
          <div className="rounded-[28px] border border-red-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertTriangle size={26} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-red-700">
              تعذر إكمال حساب التكلفة
            </h2>

            <p className="mt-3 text-sm leading-7 text-red-700/90">
              {pageError}
            </p>

            {/* Error action */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={goPrevious}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-qadder-primary px-6 py-3 font-semibold text-qadder-primary transition hover:bg-qadder-light"
              >
                <ChevronRight size={18} />
                السابق
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-qadder-border/30 bg-white p-5 md:p-6">
            {/* Original uploaded image */}
            {imageUrl && (
              <div className="mb-3 overflow-hidden rounded-[24px] border border-qadder-border/20 bg-white p-3 md:p-4">
                <div className="overflow-hidden rounded-[20px] bg-white">
                  <img
                    src={imageUrl}
                    alt="الصورة الأصلية"
                    className="h-[260px] w-full object-cover md:h-[420px]"
                  />
                </div>
              </div>
            )}

            {/* Damage cost cards */}
            <div className="space-y-4">
              {rows.length > 0 ? (
                rows.map((item, index) => (
                  <div
                    key={item.damage_id || index}
                    className="rounded-[24px] border border-qadder-border/25 bg-white p-4 shadow-sm md:p-5"
                  >
                    {/* Damage header */}
                    <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                            {item.damage_no ?? index + 1}
                        </div>

                        <h3 className="text-lg font-bold text-qadder-dark">
                            الضرر
                        </h3>
                        </div>

                    {/* Damage details */}
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                        <span className="text-sm font-bold text-qadder-dark">
                          الجزء المتضرر:
                        </span>
                        <span className="mr-2 text-sm text-qadder-dark/80">
                          {item.part_name_ar || item.part_name_en || "غير معروف"}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                        <span className="text-sm font-bold text-qadder-dark">
                            الشدة:
                        </span>
                        <span className="mr-2 text-sm text-qadder-dark/80">
                            {item.severity_ar || item.severity_en || "غير معروف"}
                        </span>
                        </div>

                      <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                        <span className="text-sm font-bold text-qadder-dark">
                          تكلفة القطعة:
                        </span>
                        <span className="mr-2 text-sm text-qadder-dark/80">
                          {formatCurrency(item.part_price)}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                        <span className="text-sm font-bold text-qadder-dark">
                          تكلفة شغل اليد:
                        </span>
                        <span className="mr-2 text-sm text-qadder-dark/80">
                          {formatCurrency(item.labor_cost)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-qadder-border/30 bg-qadder-background p-4 text-sm text-qadder-dark/70">
                  لا توجد بيانات تكلفة لعرضها.
                </div>
              )}
            </div>

            {/* Summary section */}
            <div className="mt-6 rounded-[24px] border border-qadder-border/25 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-right text-xl font-bold text-qadder-dark">
                المجموع:
              </h3>

              <div className="space-y-3">

                <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                  <span className="text-sm font-bold text-qadder-dark">
                    إجمالي التكلفة:
                  </span>
                  <span className="mr-2 text-sm text-qadder-dark/80">
                    {formatCurrency(summary?.total_estimated_cost)}
                  </span>
                </div>

                <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                  <span className="text-sm font-bold text-qadder-dark">
                    نسبة الخطأ:
                  </span>
                  <span className="mr-2 text-sm text-qadder-dark/80">
                    {Number(summary?.fault_percentage || 0).toFixed(2)}%
                  </span>
                </div>

                <div className="rounded-2xl border border-qadder-border/20 bg-green-100 px-4 py-3">
                <div className="text-sm font-bold text-qadder-dark">
                    التكلفة النهائية بعد نسبة الخطأ:
                </div>
                <div className="mt-2 text-sm text-qadder-dark/80">
                    {formatCurrency(summary?.adjusted_cost)}
                </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={goNext}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-8 py-3 font-semibold text-white transition hover:bg-qadder-dark"
              >
                التالي
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={goPrevious}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-qadder-primary px-8 py-3 font-semibold text-qadder-primary transition hover:bg-qadder-light"
              >
                <ChevronRight size={18} />
                السابق
              </button>
            </div>
          </div>
        )}
      </section>

      <ContactUs />
    </main>
  );
}