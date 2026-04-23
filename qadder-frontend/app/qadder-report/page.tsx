// This page displays all previously generated reports for the user.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import ContactUs from "@/components/ContactUs";
import PageLoader from "@/components/PageLoader";
import { AlertTriangle, Check } from "lucide-react";
import { ChevronRight, Download, Share2 } from "lucide-react";

// Base URL for the backend server.
const BACKEND_URL = "http://127.0.0.1:8000";
// API endpoint to fetch reports
const REPORTS_API_URL = `${BACKEND_URL}/step8/reports`;

// Type definition for a single report item returned from the backend.
type OwnerData = {
  full_name?: string;
  nationality?: string;
  national_id_or_iqama?: string;
  phone?: string;
  email?: string;
  license_type?: string;
  license_expiry_date?: string;
};

type VehicleData = {
  make?: string;
  model?: string;
  color?: string | number;
  manufacture_year?: string | number;
  plate_number?: string;
};

type AccidentData = {
  accident_number?: string;
  accident_coordinates?: string;
  accident_time?: string;
  accident_date?: string;
  damage_side?: string;
  fault_percentage?: string | number;
};

type CaseData = {
  id?: string;
  case_number?: string;
  status?: string;
  created_at?: string;
  original_image_path?: string;

  owner?: OwnerData;
  vehicle?: VehicleData;
  accident?: AccidentData;

  owner_name?: string;
  owner_nationality?: string;
  owner_id_number?: string;
  owner_phone?: string;
  owner_email?: string;

  license_type?: string;
  license_expiry_date?: string;

  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_year?: string | number;

  accident_number?: string;
  accident_coordinates?: string;
  accident_time?: string;
  accident_date?: string;
  damage_side?: string;
  fault_percentage?: string | number;

  first_name?: string;
  second_name?: string;
  third_name?: string;
  last_name?: string;
  nationality?: string;
  national_id?: string;
  phone_number?: string;
  email?: string;

  brand?: string;
  model?: string;
  year?: string | number;
  color?: string;
  plate_number?: string;

  accident_id?: string;
  damage_area?: string;
  damage_area_ar?: string;
};

type DamageItem = {
  id?: string;
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
};

type TotalData = {
  damages_count?: number;
  total_parts?: number;
  total_labor?: number;
  total_estimated_cost?: number;
  adjusted_cost?: number;
  fault_percentage?: string | number;
};

type ReportResponse = {
  message?: string;
  case_id?: string;
  status?: string;
  report_path?: string;
  data?: {
    case?: CaseData;
    damages?: DamageItem[];
    total?: TotalData | null;
  };
};

// Formats the date into a readable Arabic format.
function formatCurrency(value?: number) {
  return `${Number(value || 0).toFixed(2)} ريال`;
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toImageUrl(path?: string) {
  if (!path) return "";
  return `${BACKEND_URL}/${String(path).replace(/\\/g, "/")}`;
}

function severityBadgeClass(severity: string) {
  const value = severity.trim().toLowerCase();

  if (
    value === "high" ||
    value === "مرتفع" ||
    value === "عالي" ||
    value === "عالية"
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (
    value === "medium" ||
    value === "متوسط" ||
    value === "متوسطة"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (
    value === "low" ||
    value === "خفيف" ||
    value === "خفيفة"
  ) {
    return "bg-green-50 text-green-700 border-green-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

// Main page component for displaying previous reports.
export default function QadderReportPage() {
  const router = useRouter();
  const params = useSearchParams();

  const caseId = params.get("case_id") || "";
  const imagePathParam = params.get("image") || "";

  const hasSavedRef = useRef(false);

  // Controls the loading state while fetching reports.
  const [pageLoading, setPageLoading] = useState(true);

  // Stores any error message if fetching reports fails.
  const [pageError, setPageError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [caseInfo, setCaseInfo] = useState<CaseData | null>(null);
  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [total, setTotal] = useState<TotalData | null>(null);
  const [reportPath, setReportPath] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // Fetch reports when the page loads for the first time.
  useEffect(() => {
    if (!caseId) {
      setPageError("معرّف الحالة غير موجود.");
      setPageLoading(false);
      return;
    }

    // Prevent duplicate API calls if the report has already been saved
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    // Function to save the final report and then load its data
    const saveAndLoadReport = async () => {
      try {
        setPageLoading(true);
        setPageError("");
        // Reset success message before starting new process
        setSaveMessage("");

        // Send POST request to generate and save the final report
        const postRes = await fetch(`${BACKEND_URL}/step8/${caseId}`, {
          method: "POST",
        });

        const postResult = await postRes.json();

        // Handle error if report saving fails
        if (!postRes.ok) {
          throw new Error(
            postResult.detail ||
            postResult.message ||
            "فشل في حفظ التقرير النهائي"
          );
        }

        // Show success message after report is generated successfully
        setSaveMessage("تم الانتهاء من إعداد التقرير بنجاح");

        setTimeout(() => {
          setSaveMessage("");
        }, 4000);
        setReportPath(postResult?.data?.report_path || "");

        // Fetch full report data (case info, damages, totals)
        const getRes = await fetch(`${BACKEND_URL}/step8/${caseId}/data`);

        // Parse report data response
        const getResult: ReportResponse = await getRes.json();

        // Handle error if fetching report data fails
        if (!getRes.ok) {
          throw new Error(
            getResult.message || "فشل في تحميل بيانات التقرير النهائي"
          );
        }

        // Save case information into state
        setCaseInfo(getResult.data?.case || null);
        // Save detected damages list
        setDamages(getResult.data?.damages || []);
        // Save total cost calculations
        setTotal(getResult.data?.total || null);
        setReportPath(
          getResult.report_path || postResult?.data?.report_path || ""
        );
      } catch (error: any) {
        console.error(error);
        setPageError(error.message || "تعذر حفظ أو تحميل بيانات التقرير.");
      } finally {
        setPageLoading(false);
      }
    };

    // Execute report save and load process
    saveAndLoadReport();
  }, [caseId]);

  const caseStatus = String(caseInfo?.status || "").toLowerCase();

  // Check if the case is classified as high severity (rejected cases)
  const isHighSeverity = useMemo(() => {
    return (
      caseStatus === "step3_rejected_high_severity" ||
      caseStatus.includes("rejected_high_severity") ||
      (caseStatus.includes("reject") && caseStatus.includes("high")) ||
      (caseStatus.includes("رفض") && caseStatus.includes("عالي"))
    );
  }, [caseStatus]);

  // Define progress steps based on severity status
  const steps = useMemo(() => {
    return isHighSeverity
      ? ["رفع التقرير", "رفع الصورة", "تحليل الأضرار", "التقرير النهائي"]
      : ["رفع التقرير", "رفع الصورة", "تحليل الأضرار", "حساب التكلفة", "التقرير النهائي"];
  }, [isHighSeverity]);

  // Generate full image URL for displaying the uploaded image
  const imageUrl = useMemo(() => {
    return toImageUrl(caseInfo?.original_image_path || imagePathParam);
  }, [caseInfo, imagePathParam]);

  // Extract and normalize owner information from different possible sources
  const ownerData = useMemo(() => {
    const fullName = [
      caseInfo?.first_name,
      caseInfo?.second_name,
      caseInfo?.third_name,
      caseInfo?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      full_name:
        fullName ||
        caseInfo?.owner?.full_name ||
        caseInfo?.owner_name,

      nationality:
        caseInfo?.nationality ||
        caseInfo?.owner?.nationality ||
        caseInfo?.owner_nationality,

      national_id_or_iqama:
        caseInfo?.national_id ||
        caseInfo?.owner?.national_id_or_iqama ||
        caseInfo?.owner_id_number,

      phone:
        caseInfo?.phone_number ||
        caseInfo?.owner?.phone ||
        caseInfo?.owner_phone,

      email:
        caseInfo?.email ||
        caseInfo?.owner?.email ||
        caseInfo?.owner_email,

      license_type:
        caseInfo?.license_type ||
        caseInfo?.owner?.license_type,

      license_expiry_date:
        caseInfo?.license_expiry_date ||
        caseInfo?.owner?.license_expiry_date,
    };
  }, [caseInfo]);

  const vehicleData = useMemo(() => {
    return {
      make:
        caseInfo?.brand ||
        caseInfo?.vehicle?.make ||
        caseInfo?.vehicle_make,

      model:
        caseInfo?.model ||
        caseInfo?.vehicle?.model ||
        caseInfo?.vehicle_model,

      color:
        caseInfo?.color ||
        caseInfo?.vehicle?.color ||
        caseInfo?.vehicle_color,

      manufacture_year:
        caseInfo?.year ||
        caseInfo?.vehicle?.manufacture_year ||
        caseInfo?.vehicle_year,

      plate_number:
        caseInfo?.plate_number ||
        caseInfo?.vehicle?.plate_number,
    };
  }, [caseInfo]);

  const accidentData = useMemo(() => {
    return {
      accident_number:
        caseInfo?.accident_id ||
        caseInfo?.accident?.accident_number ||
        caseInfo?.accident_number,

      accident_coordinates:
        caseInfo?.accident_coordinates ||
        caseInfo?.accident?.accident_coordinates,

      accident_time:
        caseInfo?.accident_time ||
        caseInfo?.accident?.accident_time,

      accident_date:
        caseInfo?.accident_date ||
        caseInfo?.accident?.accident_date,

      damage_side:
        caseInfo?.damage_area_ar ||
        caseInfo?.damage_area ||
        caseInfo?.damage_side ||
        caseInfo?.accident?.damage_side,

      fault_percentage:
        caseInfo?.fault_percentage ??
        caseInfo?.accident?.fault_percentage ??
        total?.fault_percentage,
    };
  }, [caseInfo, total]);

  const requestStatusText = isHighSeverity ? "مرفوض" : "مقبول";

  const goPrevious = () => {
    // Prevent duplicate API calls (run only once)
    if (isHighSeverity) {
      router.push(`/analysis?case_id=${caseId}`);
      return;
    }

    router.push(
      `/cost?case_id=${caseId}&image=${encodeURIComponent(imagePathParam || "")}`
    );
  };

  // Save the final report and then fetch its full data
  // Save the final report and then fetch its full data
  const handleDownloadReport = () => {
    if (!reportPath) {
      setPageError("رابط التقرير غير موجود.");
      return;
    }

    const reportUrl = `${BACKEND_URL}/${String(reportPath).replace(/\\/g, "/")}`;
    window.open(reportUrl, "_blank");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar isLoggedIn={true} />

      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-8">
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto flex min-w-[720px] items-start justify-between gap-2 md:min-w-0">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const done = stepNumber < steps.length;
                const active = stepNumber === steps.length;

                return (
                  <div key={step} className="flex flex-1 items-start">
                    <div className="flex flex-1 flex-col items-center text-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition ${done && !active
                            ? "border-qadder-primary bg-qadder-primary text-white"
                            : active
                              ? "border-qadder-primary bg-white text-qadder-primary ring-4 ring-qadder-secondary/25"
                              : "border border-qadder-border/40 bg-white text-qadder-dark/55"
                          }`}
                      >
                        {done && !active ? <Check size={18} /> : stepNumber}
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

                    {index !== steps.length - 1 && (
                      <div className="mt-6 h-[2px] flex-1 rounded-full bg-qadder-border/30">
                        <div className="h-full rounded-full bg-qadder-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 text-right">
            <h1 className="text-2xl font-bold md:text-4xl">التقرير النهائي</h1>
            <p className="mt-2 text-center text-sm text-gray-500">
              يتضمن هذا التقرير كافة تفاصيل الحالة والتقدير المالي للأضرار
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-6 md:py-8">
        {pageLoading ? (
          <div className="rounded-[28px] border border-qadder-border/30 bg-white p-8">
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-6 text-center">
              <PageLoader text="جاري حفظ وتحميل التقرير النهائي..." />
            </div>
          </div>
        ) : pageError ? (
          <div className="rounded-[28px] border border-red-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertTriangle size={26} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-red-700">
              تعذر تحميل التقرير النهائي
            </h2>

            <p className="mt-3 text-sm leading-7 text-red-700/90">{pageError}</p>
          </div>
        ) : (
          <>
            {saveMessage && (
              <div className="mb-4 rounded-[20px] border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                {saveMessage}
              </div>
            )}
            <div className="rounded-[32px] border border-qadder-border/30 bg-white p-5 shadow-sm md:p-8">
              <div className="space-y-5">



                {/* Report Information Section */}
                <CardSection title="معلومات التقرير">
                  <InfoGrid>
                    <InfoCard label="رقم الحالة" value={formatValue(caseInfo?.case_number)} />
                    <InfoCard label="تاريخ الإنشاء" value={formatDate(caseInfo?.created_at)} />
                  </InfoGrid>
                </CardSection>

                {/* Owner Information Section */}
                <CardSection title="معلومات مالك المركبة">
                  <InfoGrid>
                    <InfoCard label="الاسم" value={formatValue(ownerData.full_name)} />
                    <InfoCard label="الجنسية" value={formatValue(ownerData.nationality)} />
                    <InfoCard
                      label="رقم الهوية / الإقامة"
                      value={formatValue(ownerData.national_id_or_iqama)}
                    />
                    <InfoCard label="رقم الجوال" value={formatValue(ownerData.phone)} />
                    <InfoCard label="الإيميل" value={formatValue(ownerData.email)} />
                    <InfoCard label="نوع الرخصة" value={formatValue(ownerData.license_type)} />
                    <InfoCard
                      label="تاريخ انتهاء الرخصة"
                      value={formatDate(ownerData.license_expiry_date)}
                    />

                    <InfoCard
                      label="حالة الطلب"
                      value={requestStatusText}
                      badgeClass={
                        isHighSeverity
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    />
                  </InfoGrid>
                </CardSection>

                {/* Vehicle Information Section */}
                <CardSection title="معلومات المركبة">
                  <InfoGrid>
                    <InfoCard label="العلامة التجارية" value={formatValue(vehicleData.make)} />
                    <InfoCard label="الموديل" value={formatValue(vehicleData.model)} />
                    <InfoCard label="اللون" value={formatValue(vehicleData.color)} />
                    <InfoCard
                      label="سنة الصنع"
                      value={formatValue(vehicleData.manufacture_year)}
                    />
                    <InfoCard label="رقم اللوحة" value={formatValue(vehicleData.plate_number)} />
                  </InfoGrid>
                </CardSection>

                {/* Accident Information Section */}
                <CardSection title="معلومات الحادث من تقرير نجم">
                  <InfoGrid>
                    <InfoCard
                      label="رقم الحادث"
                      value={formatValue(accidentData.accident_number)}
                    />
                    <InfoCard
                      label="إحداثيات الحادث"
                      value={formatValue(accidentData.accident_coordinates)}
                    />
                    <InfoCard
                      label="وقت الحادث"
                      value={formatValue(accidentData.accident_time)}
                    />
                    <InfoCard
                      label="تاريخ الحادث"
                      value={formatDate(accidentData.accident_date)}
                    />
                    <InfoCard
                      label="جهة الضرر"
                      value={formatValue(accidentData.damage_side)}
                    />
                    <InfoCard
                      label="نسبة الخطأ"
                      value={
                        accidentData.fault_percentage !== undefined &&
                          accidentData.fault_percentage !== null &&
                          accidentData.fault_percentage !== ""
                          ? `${accidentData.fault_percentage}%`
                          : "-"
                      }
                    />
                  </InfoGrid>

                </CardSection>
                {imageUrl && (
                  <div className="rounded-[28px] border border-qadder-border/30 bg-white p-5 md:p-6">

                    {/* Damage Image Section */}
                    <div className="overflow-hidden rounded-[24px] border border-qadder-border/20 bg-qadder-background">
                      <img
                        src={imageUrl}
                        alt="صورة الضرر"
                        className="h-[260px] w-full object-contain md:h-[420px]"
                      />
                    </div>
                  </div>
                )}

                {/* Case Status Section (High Severity Rejection) */}
                {isHighSeverity ? (
                  <CardSection title="حالة الطلب">
                    <div className="rounded-[24px] border border-red-200 bg-red-50 p-5">
                      <h3 className="text-lg font-bold text-red-700">تم رفض الطلب</h3>
                      <p className="mt-3 text-sm leading-7 text-red-700/90">
                        نظرًا لارتفاع شدة الضرر، يرجى التوجه إلى أحد مراكز التقدير المعتمدة لاستكمال إجراءات التقييم ومعاينة المركبة بشكل دقيق.
                      </p>
                    </div>
                  </CardSection>
                ) : (
                  <>
                    {/* Damages Details Section */}
                    <CardSection title="تفاصيل الأضرار والتكاليف">
                      <div className="space-y-4">
                        {damages.length > 0 ? (
                          damages.map((item, index) => (
                            <div
                              key={item.id || item.damage_no || index}
                              className="rounded-[24px] border border-qadder-border/25 bg-white p-4 shadow-sm md:p-5"
                            >
                              <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                                  {item.damage_no || index + 1}
                                </div>

                                <h3 className="text-lg font-bold text-qadder-dark">
                                  الضرر
                                </h3>
                              </div>

                              <InfoGrid>
                                <InfoCard
                                  label="نوع الضرر"
                                  value={formatValue(item.damage_type_ar || item.damage_type_en)}
                                />
                                <InfoCard
                                  label="الجزء المتضرر"
                                  value={formatValue(item.part_name_ar || item.part_name_en)}
                                />
                                <InfoCard
                                  label="الشدة"
                                  value={formatValue(item.severity_ar || item.severity_en)}
                                  badgeClass={severityBadgeClass(
                                    item.severity_ar || item.severity_en || "-"
                                  )}
                                />
                                <InfoCard
                                  label="تكلفة القطعة"
                                  value={formatCurrency(item.part_price)}
                                />
                                <InfoCard
                                  label="تكلفة شغل اليد"
                                  value={formatCurrency(item.labor_cost)}
                                />
                              </InfoGrid>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-qadder-border/30 bg-qadder-background p-4 text-sm text-qadder-dark/70">
                            لا توجد أضرار مكتشفة لعرضها.
                          </div>
                        )}
                      </div>
                    </CardSection>

                    {/* Final Cost Summary Section */}
                    <CardSection title="الملخص المالي النهائي">
                      <InfoGrid>
                        <InfoCard
                          label="عدد الأضرار"
                          value={formatValue(total?.damages_count || damages.length || 0)}
                        />
                        <InfoCard
                          label="إجمالي تكلفة القطع"
                          value={formatCurrency(total?.total_parts)}
                        />
                        <InfoCard
                          label="إجمالي تكلفة شغل اليد"
                          value={formatCurrency(total?.total_labor)}
                        />
                        <InfoCard
                          label="إجمالي التكلفة"
                          value={formatCurrency(total?.total_estimated_cost)}
                        />
                        <InfoCard
                          label="نسبة الخطأ"
                          value={
                            accidentData.fault_percentage !== undefined &&
                              accidentData.fault_percentage !== null &&
                              accidentData.fault_percentage !== ""
                              ? `${accidentData.fault_percentage}%`
                              : "-"
                          }
                        />
                        <InfoCard
                          label="التكلفة النهائية بعد نسبة الخطأ"
                          value={formatCurrency(total?.adjusted_cost)}
                          badgeClass="bg-green-50 text-green-700 border-green-200"
                        />
                      </InfoGrid>
                    </CardSection>
                  </>
                )}
                {/* Action Buttons Section */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">

                  {/* تنزيل */}
                  <button
                    onClick={handleDownloadReport}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-6 py-3 font-semibold text-white transition hover:bg-qadder-dark"
                  >
                    <Download size={18} />
                    تنزيل التقرير
                  </button>

                  {/* مشاركة */}
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-qadder-primary px-6 py-3 font-semibold text-qadder-primary transition hover:bg-qadder-light"
                  >
                    <Share2 size={18} />
                    مشاركة التقرير
                  </button>

                  {/* السابق */}
                  <button
                    onClick={goPrevious}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-qadder-primary px-6 py-3 font-semibold text-qadder-primary transition hover:bg-qadder-light"
                  >
                    <ChevronRight size={18} />
                    السابق
                  </button>

                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <ContactUs />
    </main>
  );
}
// Reusable card container for grouping related report information
function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-qadder-border/30 bg-white p-5 md:p-6">
      <h2 className="mb-4 text-lg font-bold text-qadder-dark">{title}</h2>
      {children}
    </div>
  );
}
// Layout component to display information cards in a responsive grid
function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}
// Component to display a single label-value pair with flexible layout
function InfoCard({
  label,
  value,
  badgeClass,
}: {
  label: string;
  value: string;
  badgeClass?: string;
}) {
  const verticalFields = [
    "رقم الحالة",
    "الاسم",
    "الإيميل",
    "إحداثيات الحادث",
    "وقت الحادث",
    "إجمالي تكلفة شغل اليد",
    "التكلفة النهائية بعد النسبة",
  ];

  const isVertical = verticalFields.includes(label);

  return (
    <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3 text-right">
      {isVertical ? (
        <>
          <p className="text-sm font-bold text-qadder-dark">{label}:</p>

          {badgeClass ? (
            <div
              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeClass}`}
            >
              {value}
            </div>
          ) : (
            <p
              className="mt-2 text-sm text-qadder-dark/80 break-words [overflow-wrap:anywhere]"
              dir="auto"
            >
              {value}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 flex-wrap" dir="rtl">
          <span className="text-sm font-bold text-qadder-dark whitespace-nowrap">
            {label}:
          </span>

          {badgeClass ? (
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeClass}`}
            >
              {value}
            </span>
          ) : (
            <span className="text-sm text-qadder-dark/80" dir="auto">
              {value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}