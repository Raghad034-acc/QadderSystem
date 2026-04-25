"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import ContactUs from "@/components/ContactUs";
import PageLoader from "@/components/PageLoader";
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";

// Backend base URL
const BACKEND_URL = "http://127.0.0.1:8000";

// Step 3 response type
type Step3Response = {
  message?: string;
  case_id?: string;
  status?: string;
  step3_result?: {
    severity_status?: string;
    severity_en?: string;
    severity_ar?: string;
    severity_confidence?: number;
    raw_label?: string;
    message?: string;
    errors?: string[];
    original_image_path?: string;
  };
  detail?: string;
};

// Step 4 damage item type
type Step4Damage = {
  damage_no?: number;
  damage_type_en?: string;
  damage_type_ar?: string;
  damage_confidence?: number;
  crop_path?: string;
};

// Step 4 response type
type Step4Response = {
  message?: string;
  case_id?: string;
  status?: string;
  step4_result?: {
    step4_status?: string;
    message?: string;
    annotated_image_path?: string;
    damages_count?: number;
    damages?: Step4Damage[];
  };
  detail?: string;
};

// Step 5 damage item type
type Step5Damage = {
  damage_no?: number;
  part_name_en?: string;
  part_name_ar?: string;
  vote_ratio?: number;
  vote_label?: string;
  part_status?: string;
};

// Step 5 response type
type Step5Response = {
  message?: string;
  case_id?: string;
  status?: string;
  step5_result?: {
    step5_status?: string;
    message?: string;
    damage_side?: string;
    parts_mask_path?: string;
    parts_overlay_path?: string;
    damage_parts_annotated_path?: string;
    damages_count?: number;
    damages?: Step5Damage[];
  };
  detail?: string;
};

// Step 6 damage item type
type Step6Damage = {
  damage_no?: number;
  severity_en?: string;
  severity_ar?: string;
  severity_confidence?: number;
  severity_status?: string;
};

// Step 6 response type
type Step6Response = {
  message?: string;
  case_id?: string;
  status?: string;
  step6_result?: {
    damages_count?: number;
    predicted_count?: number;
    failed_count?: number;
    damages?: Step6Damage[];
  };
  detail?: string;
};

// Return badge styles based on severity value
function severityBadgeClass(severity: string) {
  const value = severity.trim().toLowerCase();

  if (value === "high" || value === "مرتفع") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "medium" || value === "متوسط") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  return "bg-green-50 text-green-700 border-green-200";
}

export default function AnalysisPage() {
  // Navigation and query params hooks
  const router = useRouter();
  const params = useSearchParams();
  const startedRef = useRef(false);

  // Read case id and damage side from URL
  const caseId = params.get("case_id") || "";
  const damageSide = params.get("damage") || "";

  // Page state
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // API responses for steps 3 to 6
  const [step3Response, setStep3Response] = useState<Step3Response | null>(null);
  const [step4Response, setStep4Response] = useState<Step4Response | null>(null);
  const [step5Response, setStep5Response] = useState<Step5Response | null>(null);
  const [step6Response, setStep6Response] = useState<Step6Response | null>(null);

  // Current loader text and severity state
  const [currentAction, setCurrentAction] = useState("جاري بدء تحليل الضرر...");
  const [isHighSeverity, setIsHighSeverity] = useState(false);

  // Dynamic steps based on severity result
  const steps = isHighSeverity
    ? ["رفع التقرير", "رفع الصورة", "تحليل الأضرار", "التقرير النهائي"]
    : ["رفع التقرير", "رفع الصورة", "تحليل الأضرار", "حساب التكلفة", "التقرير النهائي"];

  // Severity label fallback
  const step3SeverityAr =
    step3Response?.step3_result?.severity_ar ||
    step3Response?.step3_result?.severity_en ||
    "غير معروف";

  // Original image path from step 3
  const imagePath = step3Response?.step3_result?.original_image_path || "";

  // Build full image URL
  const imageUrl = useMemo(() => {
    if (!imagePath) return "";
    const normalized = imagePath.replace(/\\/g, "/");
    return `${BACKEND_URL}/${normalized}`;
  }, [imagePath]);

  // Merge damage data from steps 4, 5, and 6 for display
  const damageCards = useMemo(() => {
    const step4Damages = step4Response?.step4_result?.damages || [];
    const step5Damages = step5Response?.step5_result?.damages || [];
    const step6Damages = step6Response?.step6_result?.damages || [];

    return step4Damages.map((damage, index) => {
      const no = damage.damage_no ?? index + 1;

      const step5Match = step5Damages.find((item) => item.damage_no === no);
      const step6Match = step6Damages.find((item) => item.damage_no === no);

      return {
        damageNo: no,
        damageType: damage.damage_type_ar || damage.damage_type_en || "غير معروف",
        partName:
          step5Match?.part_name_ar || step5Match?.part_name_en || "غير معروف",
        detailSeverity:
          step6Match?.severity_ar || step6Match?.severity_en || "غير معروف",
      };
    });
  }, [step4Response, step5Response, step6Response]);

  // Call step 3 API
  const handleStep3 = async () => {
    setCurrentAction("جاري تحليل شدة الضرر...");
    const formData = new FormData();
    formData.append("case_id", caseId);

    const res = await fetch(`${BACKEND_URL}/step3/predict-severity`, {
      method: "POST",
      body: formData,
    });

    const data: Step3Response = await res.json();
    setStep3Response(data);

    if (!res.ok) {
      throw new Error(data.detail || "فشل تنفيذ خطوة تحليل شدة الضرر.");
    }

    const severityEn = (data?.step3_result?.severity_en || "").toLowerCase();
    const severityStatus = (data?.step3_result?.severity_status || "").toLowerCase();
    const high =
      severityEn === "high" || severityStatus === "rejected_high_severity";

    setIsHighSeverity(high);
    return { high };
  };

  // Call step 4 API
  const handleStep4 = async () => {
    setCurrentAction("جاري تحليل نوع الضرر...");
    const formData = new FormData();
    formData.append("case_id", caseId);

    const res = await fetch(`${BACKEND_URL}/step4/detect-damage-type`, {
      method: "POST",
      body: formData,
    });

    const data: Step4Response = await res.json();
    setStep4Response(data);

    if (!res.ok) {
      throw new Error(data.detail || "فشل تنفيذ خطوة تحليل نوع الضرر.");
    }
  };

  // Call step 5 API
  const handleStep5 = async () => {
    setCurrentAction("جاري تحديد الجزء المتضرر...");
    const formData = new FormData();
    formData.append("case_id", caseId);

    const res = await fetch(`${BACKEND_URL}/step5/detect-damage-part`, {
      method: "POST",
      body: formData,
    });

    const data: Step5Response = await res.json();
    setStep5Response(data);

    if (!res.ok) {
      throw new Error(data.detail || "فشل تنفيذ خطوة تحديد الجزء المتضرر.");
    }
  };

  // Call step 6 API
  const handleStep6 = async () => {
    setCurrentAction("جاري تحليل شدة كل ضرر مكتشف...");
    const formData = new FormData();
    formData.append("case_id", caseId);

    const res = await fetch(`${BACKEND_URL}/step6/predict-damage-severity`, {
      method: "POST",
      body: formData,
    });

    const data: Step6Response = await res.json();
    setStep6Response(data);

    if (!res.ok) {
      throw new Error(data.detail || "فشل تنفيذ خطوة تحليل شدة الأضرار التفصيلية.");
    }
  };

  // Run analysis once when page loads
  useEffect(() => {
    if (!caseId) {
      setPageError("معرّف الحالة غير موجود. الرجاء العودة ورفع الصورة من جديد.");
      setPageLoading(false);
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    const runAnalysis = async () => {
      try {
        setPageError("");
        setPageLoading(true);

        const step3 = await handleStep3();

        if (step3.high) {
          setCurrentAction("تم إيقاف التحليل لأن شدة الضرر مرتفعة.");
          setPageLoading(false);
          return;
        }

        await handleStep4();
        await handleStep5();
        await handleStep6();

        setCurrentAction("تم تحليل الضرر بنجاح.");
      } catch (error) {
        console.error(error);
        setPageError(
          error instanceof Error ? error.message : "حدث خطأ أثناء تحليل الضرر."
        );
      } finally {
        setPageLoading(false);
      }
    };

    runAnalysis();
  }, [caseId]);

  // Go back to upload page
  const goPrevious = () => {
    router.push(`/upload-images?case_id=${caseId}&damage=${damageSide}`);
  };

  // Go to next page based on severity result
  const goNext = () => {
    if (isHighSeverity) {
      router.push(
        `/qadder-report?case_id=${caseId}&image=${encodeURIComponent(imagePath || "")}`
      );
      return;
    }

    router.push(
      `/cost?case_id=${caseId}&image=${encodeURIComponent(imagePath || "")}`
    );
  };

  return (
    <main dir="rtl" className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar isLoggedIn={true} />

      {/* Header and progress section */}
      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-8">
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto flex min-w-[720px] items-start justify-between gap-2 md:min-w-0">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const done = stepNumber < 3;
                const active = stepNumber === 3;

                return (
                  <div key={step} className="flex flex-1 items-start">
                    <div className="flex flex-1 flex-col items-center text-center">
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

                      <p
                        className={`mt-3 text-xs leading-6 md:text-sm ${active
                            ? "font-bold text-qadder-dark"
                            : "font-medium text-qadder-dark/65"
                          }`}
                      >
                        {step}
                      </p>
                    </div>

                    {/* Progress line between steps */}
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

          <div className="mt-5 text-right">
            <h1 className="text-2xl font-bold md:text-4xl">
              نتائج تحليل الضرر
            </h1>
          </div>
        </div>
      </section>

      {/* Main content section */}
      <section className="mx-auto max-w-4xl px-6 py-8 md:py-10">
        {pageLoading ? (
          <div className="rounded-[28px] border border-qadder-border/30 bg-white p-8">
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-6 text-center">
              <PageLoader text={currentAction} />
            </div>
          </div>
        ) : pageError ? (
          <div className="rounded-[28px] border border-red-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertTriangle size={26} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-red-700">
              تعذر إكمال التحليل
            </h2>

            <p className="mt-3 text-sm leading-7 text-red-700/90">
              {pageError}
            </p>

          </div>
        ) : (
          <div className="rounded-[28px] border border-qadder-border/30 bg-white p-5 md:p-6">
            {/* Show original uploaded image */}
            {imageUrl && (
              <div className="mb-4 overflow-hidden rounded-[24px] border border-qadder-border/20 bg-white p-3 md:p-4">
                <div className="overflow-hidden rounded-[20px] bg-white">
                  <img
                    src={imageUrl}
                    alt="الصورة الأصلية"
                    className="h-[260px] w-full object-cover md:h-[420px]"
                  />
                </div>
              </div>
            )}

            {/* High severity warning */}
            {isHighSeverity ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-red-600">
                    <AlertTriangle size={22} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-base font-bold leading-7 text-red-700 md:text-lg">
                      تنبيه: شدة الضرر مرتفعة ويُحتمل وجود ضرر في القطع الداخليه يرجى منك التوجه الى اقرب مركز تقدير لمعرفة التقدير الدقيّق للاضرار
                    </p>

                    <a
                      href="http://taqdeer.sa/"
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm font-medium text-black underline underline-offset-4"
                    >
                      ملاحظة: اضغط هنا لمعرفة أقرب مركز تقدير لك
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Render detected damages */}
                {damageCards.length > 0 ? (
                  damageCards.map((item) => (
                    <div
                      key={item.damageNo}
                      className="rounded-[24px] border border-qadder-border/25 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                          {item.damageNo}
                        </div>

                        <h3 className="text-lg font-bold text-qadder-dark">
                          الضرر
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                          <span className="text-sm font-bold text-qadder-dark">
                            نوع الضرر:
                          </span>
                          <span className="mr-2 text-sm text-qadder-dark/80">
                            {item.damageType}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                          <span className="text-sm font-bold text-qadder-dark">
                            الأجزاء المتضررة:
                          </span>
                          <span className="mr-2 text-sm text-qadder-dark/80">
                            {item.partName}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3">
                          <span className="text-sm font-bold text-qadder-dark">
                            شدة الضرر التفصيلية:
                          </span>
                          <span
                            className={`mr-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${severityBadgeClass(
                              item.detailSeverity
                            )}`}
                          >
                            {item.detailSeverity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-qadder-border/30 bg-qadder-background p-4 text-sm text-qadder-dark/70">
                    لا توجد أضرار مكتشفة لعرضها.
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={goNext}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-8 py-3 font-semibold text-white transition hover:bg-qadder-dark"
              >
                التالي
                <ChevronLeft size={18} />
              </button>    
            </div>
          </div>
        )}
      </section>

      <ContactUs />
    </main>
  );
}