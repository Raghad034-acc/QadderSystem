"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import ContactUs from "@/components/ContactUs";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  Trash2,
  UploadCloud,
} from "lucide-react";

/**
 * Map backend rejection reasons to user-friendly messages
 */
function getErrorMessage(reason: string | null) {
  switch (reason) {
    case "side_mismatch":
      return "الصورة غير مطابقة لجهة الضرر المذكورة في تقرير نجم، يرجى رفع صورة جديدة مطابقة.";

    case "orientation_unknown":
      return "لم نتمكن من تحديد جهة الضرر من الصورة، يرجى رفع صورة أوضح.";

    default:
      return "تم رفض الصورة، يرجى المحاولة مرة أخرى.";
  }
}

/**
 * Steps progress indicator
 */
const steps = [
  "رفع التقرير",
  "رفع الصورة",
  "تحليل الأضرار",
  "حساب التكلفة",
  "التقرير النهائي",
];

export default function UploadImagesPage() {
  const params = useSearchParams();
  const router = useRouter();

  // References to file inputs (upload & replace)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  // Query params
  const caseId = params.get("case_id");
  const damageSide = params.get("damage");

  // State management
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiredError, setRequiredError] = useState("");
  const [serverMessage, setServerMessage] = useState("");

  /**
   * Generate preview URL for selected image
   */
  const previewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  /**
   * Cleanup preview URL on unmount
   */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /**
   * Handle image selection
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    setRequiredError("");
    setServerMessage("");

    if (!selectedFile) return;
    setImage(selectedFile);
  };

  /**
   * Remove selected image and reset inputs
   */
  const handleRemoveImage = () => {
    setImage(null);
    setRequiredError("");
    setServerMessage("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  /**
   * Upload image to backend (Step 2)
   */
  const handleUpload = async () => {
    setRequiredError("");
    setServerMessage("");

    // Validate image exists
    if (!image) {
      setRequiredError("يجب رفع صورة الضرر قبل المتابعة.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("case_id", caseId || "");
    formData.append("file", image);

    try {
      const res = await fetch("http://127.0.0.1:8000/step2/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // Handle backend error response
      if (!res.ok) {
        if (typeof data?.detail === "string") {
          setServerMessage(data.detail);
        } else {
          setServerMessage("حدث خطأ أثناء رفع الصورة.");
        }
        return;
      }

      const isAccepted = data?.step2_result?.is_accepted;
      const rejectionReason = data?.step2_result?.rejection_reason ?? null;

      // If accepted → go to next step
      if (isAccepted) {
        router.push(`/analysis?case_id=${caseId}&damage=${damageSide || ""}`);
        return;
      }

      // If rejected → show reason
      setServerMessage(getErrorMessage(rejectionReason));
    } catch (error) {
      console.error(error);
      setServerMessage("حدث خطأ أثناء رفع الصورة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-qadder-background text-qadder-dark">
      {/* Navbar */}
      <AppNavbar isLoggedIn={true} />

      {/* Header + Steps */}
      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-8">
          {/* Steps Progress */}
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto flex min-w-[860px] items-start justify-between gap-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const done = stepNumber < 2;
                const active = stepNumber === 2;

                return (
                  <div key={step} className="flex flex-1 items-start">
                    <div className="flex flex-1 flex-col items-center text-center">
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

                    {/* Progress line */}
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

          {/* Title */}
          <div className="mt-6 max-w-3xl text-right">
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              رفع صورة الضرر
            </h1>

            <p className="mt-4 text-base leading-8 text-qadder-dark/70 md:text-lg">
              ارفع صورة واضحة للجزء المتضرر حتى يبدأ النظام التحقق من مطابقة جهة
              الضرر مع التقرير.
            </p>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="mx-auto max-w-6xl px-6 py-6 md:py-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-qadder-border/20 bg-white p-5 shadow-sm md:p-8">
          
          {/* Guidelines */}
          <div>
            <h2 className="text-right text-xl font-bold text-qadder-dark">
              إرشادات رفع الصورة
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <GuidelineItem title="وضوح كامل" description="يجب أن يظهر الجزء المتضرر كاملًا داخل الإطار ." />
              <GuidelineItem title="إضاءة مناسبة" description="تجنب الإضاءة الضعيفة." />
              <GuidelineItem title="زاوية مباشرة" description="التقط الصورة بزاوية مباشرة على الضرر لتوضيح تفاصيل المنطقة المتأثرة." />
              <GuidelineItem title="تجنب الظلال والانعكاسات" description="الظلال القوية أو اللمعان قد تؤثر على نتيجة التحليل." />
            </div>
          </div>

          {/* Expected damage side */}
       <div className="mt-6 flex items-start gap-2 text-right">
  <div className="mt-1 text-amber-600">
    <AlertTriangle size={16} />
  </div>

  <p className="text-sm leading-7 text-qadder-dark/80">
    <span className="font-bold text-qadder-dark">جهة الضرر المتوقعة: </span>
    <strong className="px-1 font-bold leading-7 text-qadder-primary">
      {damageSide || "غير متوفرة"}
    </strong>
    <span> ويجب أن تطابق الصورة الجهة الموضحة في التقرير.</span>
  </p>
</div>

          {/* Errors */}
          {requiredError && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-qadder-dark">
              {requiredError}
            </div>
          )}

          {serverMessage && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-qadder-error">
              {serverMessage}
            </div>
          )}

          {/* Upload UI */}
          <div className="mt-6">
            {!image ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex min-h-[320px] w-full flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-qadder-border/70 bg-qadder-background/60 px-6 py-10 text-center transition hover:border-qadder-primary hover:bg-qadder-light/35"
                >
                  <div className="mb-5 rounded-full bg-white p-5 text-qadder-primary shadow-sm transition group-hover:scale-105">
                    <UploadCloud size={30} />
                  </div>

                  <p className="text-lg font-bold text-qadder-dark">
                    اضغط لرفع صورة الضرر
                  <span className="mr-1 text-red-500">*</span>
                  </p>

                  <p className="mt-2 text-sm leading-7 text-qadder-dark/65">
                    يدعم الملفات التالية: JPG / JPEG / PNG / WEBP
                  </p>
                </button>
              </>
            ) : (
              <div className="overflow-hidden rounded-[30px] border border-qadder-border/30 bg-qadder-background/35">
                {previewUrl && (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="معاينة صورة الضرر"
                      className="h-[340px] w-full object-cover md:h-[460px]"
                    />

                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-qadder-primary shadow-sm">
                      تمت إضافة الصورة
                    </div>
                  </div>
                )}

                <div className="p-4 md:p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      ref={replaceInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />

                    {/* Replace image */}
                    <button
                      type="button"
                      onClick={() => replaceInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-qadder-border/50 bg-white px-4 py-3.5 text-sm font-semibold text-qadder-dark transition hover:bg-qadder-light"
                    >
                      <PencilLine size={16} />
                      تغيير الصورة
                    </button>

                    {/* Delete image */}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-qadder-error transition hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                      حذف الصورة
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-5 py-4 text-sm font-bold text-white transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "جاري رفع الصورة..." : "التالي"}
              {!loading && <ChevronLeft size={18} />}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/report-review?case_id=${caseId}`)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-qadder-border/40 bg-white px-5 py-4 text-sm font-bold text-qadder-dark transition hover:bg-qadder-background"
            >
              <ChevronRight size={18} />
              السابق
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <ContactUs />
    </main>
  );
}

/**
 * Reusable guideline item component
 */
function GuidelineItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-qadder-background/45 p-4">
      <div className="rounded-full bg-white p-2 text-qadder-primary shadow-sm">
        <Check size={15} />
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-qadder-dark">{title}</p>
        <p className="mt-1 text-sm leading-7 text-qadder-dark/70">
          {description}
        </p>
      </div>
    </div>
  );
}