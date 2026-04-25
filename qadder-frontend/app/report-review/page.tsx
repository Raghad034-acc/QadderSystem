"use client";

// React hooks used for loading saved data, memoizing validation data, and managing state.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  AlertTriangle,
} from "lucide-react";

// Data extracted from the Najm report.
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

// Validation results comparing Najm report data with user/vehicle data.
type ValidationData = {
  national_id_match?: boolean;
  mobile_match?: boolean;
  nationality_match?: boolean;
  vehicle_brand_match?: boolean;
  vehicle_model_match?: boolean;
  vehicle_year_match?: boolean;
  vehicle_color_match?: boolean;
};

// Full Step 1 result saved after uploading and validating the Najm report.
type Step1Result = {
  message?: string;
  case_id?: string;
  case_number?: string;
  status?: string;
  najm_report?: NajmReportData;
  validation?: ValidationData;
};

// Steps shown in the progress indicator.
const steps = [
  "رفع التقرير",
  "رفع الصورة",
  "تحليل الأضرار",
  "حساب التكلفة",
  "التقرير النهائي",
];

export default function ReportReviewPage() {
  const router = useRouter();

  // Stores the loaded Step 1 report data.
  const [step1Data, setStep1Data] = useState<Step1Result | null>(null);

  // Controls the loading state while reading from localStorage.
  const [loading, setLoading] = useState(true);

  // Stores any error message that happens while loading the report data.
  const [error, setError] = useState("");

  // Handle user logout.
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Load saved step 1 data from localStorage.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("latestNajmStep1");

      // Stop the flow if no saved report data exists.
      if (!stored) {
        setError("لا توجد بيانات تقرير محفوظة. الرجاء رفع التقرير أولًا.");
        setLoading(false);
        return;
      }

      // Parse and store the saved Step 1 result.
      const parsed: Step1Result = JSON.parse(stored);
      setStep1Data(parsed);
    } catch (err: unknown) {
      console.error(err);

      // Show a readable error message if parsing or loading fails.
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل بيانات التقرير"
      );
    } finally {
      // Loading is finished whether the data was loaded successfully or not.
      setLoading(false);
    }
  }, []);

  // Extract navigation values.
  const caseId = step1Data?.case_id || "";
  const damageSide = step1Data?.najm_report?.damage_area_ar || "";

  // Build validation items list.
  const validationMap = useMemo(
    () => ({
      national_id: step1Data?.validation?.national_id_match,
      mobile: step1Data?.validation?.mobile_match,
      nationality: step1Data?.validation?.nationality_match,
      vehicle_brand: step1Data?.validation?.vehicle_brand_match,
      vehicle_model: step1Data?.validation?.vehicle_model_match,
      vehicle_year: step1Data?.validation?.vehicle_year_match,
      vehicle_color: step1Data?.validation?.vehicle_color_match,
    }),
    [step1Data]
  );

  // Checks if at least one validation field does not match.
  const hasAnyFalse = Object.values(validationMap).some((v) => v === false);

  // Checks if all validation fields are matched successfully.
  const hasAllTrue =
    Object.values(validationMap).length > 0 &&
    Object.values(validationMap).every((v) => v === true);

  // Determines the title shown in the validation result card.
  const matchTitle = useMemo(() => {
    if (hasAllTrue) return "جميع البيانات متطابقة";
    if (hasAnyFalse) return "يوجد بيانات غير متطابقة";
    return "تعذر تحديد نتيجة المطابقة";
  }, [hasAllTrue, hasAnyFalse]);

  // Determines the description shown under the validation result title.
  const matchDescription = useMemo(() => {
    if (hasAllTrue) {
      return "تمت مطابقة جميع البيانات بنجاح.";
    }

    if (hasAnyFalse) {
      return "بعض البيانات غير متطابقة، يرجى الرجوع ورفع تقرير نجم مرة أخرى.";
    }

    return "تعذر التحقق من البيانات.";
  }, [hasAllTrue, hasAnyFalse]);

  // Show a loading screen while the report data is being loaded.
  if (loading) {
    return (
      <main className="min-h-screen bg-qadder-background text-qadder-dark">
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />

        <section className="mx-auto max-w-7xl px-6 py-16">
          <PageLoader text="جاري تحميل بيانات التقرير..." />
        </section>
      </main>
    );
  }

  // Show an error message if the report data is missing or failed to load.
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
    <main dir="rtl"
      className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar
        isLoggedIn={true}
        handleLogout={handleLogout}
        contactHref="#contact"
      />

      {/* Header and progress section */}
      <section
        className="relative overflow-hidden border-b border-qadder-border/20"
        dir="rtl"
      >
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-8">
          {/* Steps progress */}
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto flex min-w-[860px] items-start justify-between gap-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;

                // Previous steps are marked as completed.
                const done = stepNumber < 2;

                // The current page represents step 2 in the flow.
                const active = stepNumber === 2;

                return (
                  <div key={step} className="flex flex-1 items-start">
                    <div className="flex flex-1 flex-col items-center text-center">
                      {/* Step circle */}
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition ${done
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
                        className={`mt-3 text-xs leading-6 md:text-sm ${active
                          ? "font-bold text-qadder-dark"
                          : "font-medium text-qadder-dark/65"
                          }`}
                      >
                        {step}
                      </p>
                    </div>

                    {/* Progress line */}
                    {index !== steps.length - 1 && (
                      <div className="mt-6 h-[2px] flex-1 rounded-full bg-qadder-border/30">
                        <div
                          className={`h-full rounded-full ${done ? "bg-qadder-primary" : "bg-transparent"
                            }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="mt-6 max-w-3xl text-right">
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              مراجعة بيانات تقرير نجم
            </h1>
          </div>
        </div>
      </section>

      {/* Main content section */}
      <section className="mx-auto max-w-6xl px-6 py-6 md:py-8" dir="rtl">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-qadder-border/20 bg-white p-5 shadow-sm md:p-8">
          {/* Matching result */}
          <div
            className={`rounded-[28px] border p-5 shadow-sm md:p-6 ${hasAllTrue
              ? "border-green-200 bg-green-50"
              : hasAnyFalse
                ? "border-amber-200 bg-amber-50"
                : "border-qadder-border/20 bg-qadder-background/40"
              }`}
          >
            <div className="flex items-start gap-3">
              {/* Validation status icon */}
              <div
                className={`mt-1 ${hasAllTrue
                  ? "text-green-600"
                  : hasAnyFalse
                    ? "text-amber-600"
                    : "text-qadder-primary"
                  }`}
              >
                {hasAllTrue ? (
                  <CircleCheckBig size={22} />
                ) : (
                  <CircleAlert size={22} />
                )}
              </div>

              {/* Validation status text */}
              <div className="text-right">
                <h2 className="text-lg font-bold text-qadder-dark md:text-xl">
                  {matchTitle}
                </h2>
                <p className="mt-2 text-sm leading-7 text-qadder-dark/75">
                  {matchDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Report details */}
          <div className="mt-6 rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-4 text-right text-2xl font-bold text-qadder-dark">
              بيانات التقرير
            </h2>

            {/* Report fields grid */}
            <div className="grid gap-4 md:grid-cols-2">
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
                  step1Data.najm_report?.accident_coordinates || "غير متوفرة"
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
                label="جهة الضرر"
                value={step1Data.najm_report?.damage_area_ar || "غير متوفرة"}
              />
              <InfoCard
                label="الاسم الكامل"
                value={step1Data.najm_report?.party_full_name || "غير متوفر"}
              />
              <InfoCard
                label="نوع الرخصة"
                value={step1Data.najm_report?.license_type || "غير متوفر"}
              />
              <InfoCard
                label="تاريخ انتهاء الرخصة"
                value={
                  step1Data.najm_report?.license_expiry_date || "غير متوفر"
                }
              />
              <InfoCard
                label="رقم الهوية"
                value={step1Data.najm_report?.party_national_id || "غير متوفر"}
                isMismatch={validationMap.national_id === false}
              />
              <InfoCard
                label="رقم الجوال"
                value={step1Data.najm_report?.party_mobile || "غير متوفر"}
                isMismatch={validationMap.mobile === false}
              />
              <InfoCard
                label="الجنسية"
                value={step1Data.najm_report?.party_nationality || "غير متوفرة"}
                isMismatch={validationMap.nationality === false}
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
                isMismatch={validationMap.vehicle_brand === false}
              />
              <InfoCard
                label="موديل المركبة"
                value={step1Data.najm_report?.vehicle_model || "غير متوفر"}
                isMismatch={validationMap.vehicle_model === false}
              />
              <InfoCard
                label="سنة المركبة"
                value={
                  step1Data.najm_report?.vehicle_year
                    ? String(step1Data.najm_report.vehicle_year)
                    : "غير متوفرة"
                }
                isMismatch={validationMap.vehicle_year === false}
              />
              <InfoCard
                label="لون المركبة"
                value={step1Data.najm_report?.vehicle_color || "غير متوفر"}
                isMismatch={validationMap.vehicle_color === false}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {/* Warning message shown when there are mismatched fields */}
            {hasAnyFalse && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 text-right">
                يوجد بيانات غير متطابقة، لا يمكن المتابعة. يرجى رفع تقرير نجم مرة أخرى.
              </div>
            )}

            {/* Continue button is disabled when any validation mismatch exists */}
            <button
              type="button"
              disabled={hasAnyFalse} // Disable if any mismatch exists
              onClick={() => {
                if (hasAnyFalse) return; // Extra safety
                router.push(
                  `/upload-images?case_id=${caseId}&damage=${encodeURIComponent(
                    damageSide || ""
                  )}`
                );
              }}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold text-white transition
    ${hasAnyFalse
                  ? "cursor-not-allowed bg-gray-300 text-white"
                  : "bg-qadder-primary hover:bg-qadder-dark"
                }`}
            >
              التالي
              <ChevronLeft size={18} />
            </button>
      {hasAnyFalse && (
  <button
    type="button"
    onClick={() => router.push("/upload-report")}
    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-qadder-border/40 bg-white px-5 py-4 text-sm font-bold text-qadder-dark transition hover:bg-qadder-background"
  >
    <ChevronRight size={18} />
    السابق
  </button>
)}
          </div>
        </div>
      </section>

      <ContactUs />
    </main>
  );
}

// Reusable card for displaying a single report field.
function InfoCard({
  label,
  value,
  isMismatch,
}: {
  label: string;
  value: string;
  isMismatch?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-right ${isMismatch
        ? "border-red-200 bg-red-50"
        : "border-transparent bg-qadder-background/50"
        }`}
    >
      {/* Field label */}
      <p
        className={`text-xs font-semibold ${isMismatch ? "text-red-500" : "text-qadder-dark/50"
          }`}
      >
        {label}
      </p>

      {/* Mismatch indicator */}
      {isMismatch && (
        <div className="mt-1 flex items-center gap-1 text-xs font-bold text-red-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          غير متطابق
        </div>
      )}

      {/* Field value */}
      <p
        className={`mt-2 break-words text-sm font-bold ${isMismatch ? "text-red-600" : "text-qadder-dark"
          }`}
      >
        {value}
      </p>
    </div>
  );
}