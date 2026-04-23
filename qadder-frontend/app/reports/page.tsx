"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import ContactUs from "@/components/ContactUs";
import PageLoader from "@/components/PageLoader";
// Icons from lucide-react
import { AlertTriangle, Eye, Download } from "lucide-react";

// Icons from lucide-react
const BACKEND_URL = "http://127.0.0.1:8000";

// API endpoint to fetch reports
const REPORTS_API_URL = `${BACKEND_URL}/step8/reports`;

// Type definition for report object
type ReportItem = {
  id: string;
  case_id: string;
  case_number?: string; // ✨ أضيفي هذا
  report_path: string;
  created_at?: string;
  vehicle_name?: string;
};
type StoredUser = {
  user_profile_id?: string;
};

// Function to format date into readable format
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

// Main Reports Page component
export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");


  // Fetch reports when component mounts
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setPageLoading(true);
        setPageError("");

        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          throw new Error("بيانات المستخدم غير موجودة، يرجى تسجيل الدخول من جديد");
        }

        const parsedUser: StoredUser = JSON.parse(storedUser);

        if (!parsedUser.user_profile_id) {
          throw new Error("معرّف المستخدم غير موجود");
        }

        const res = await fetch(
          `${REPORTS_API_URL}?user_profile_id=${parsedUser.user_profile_id}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.detail || "فشل في تحميل التقارير");
        }

        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (error: any) {
        setPageError(error.message || "حدث خطأ أثناء تحميل التقارير");
      } finally {
        setPageLoading(false);
      }
    };

    fetchReports();
  }, []);
  // Function to open report in a new tab
  const handleViewReport = (report: ReportItem) => {
    window.open(`${BACKEND_URL}/step8/${report.case_id}/view`, "_blank");
  };

  // Function to download report
  const handleDownloadReport = (report: ReportItem) => {
    const reportUrl = `${BACKEND_URL}/${String(report.report_path).replace(
      /^\/+/,
      ""
    )}`;
    window.open(reportUrl, "_blank");
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-qadder-background text-qadder-dark"
    >
      {/* Navigation bar */}
      <AppNavbar isLoggedIn />

      {/* Page title */}
      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-5xl px-6 py-12 md:py-16">
          <div className="text-right">

            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              التقارير السابقة
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-qadder-dark/70 md:text-lg">
              اطّلع على تقاريرك السابقة أو قم بتحميلها
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4 md:px-6 md:py-6">

        {pageLoading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[32px] border border-[#E6E8D9] bg-white p-6 shadow-sm">
            <PageLoader text="جاري التحميل..." />
          </div>
        ) : pageError ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={22} />
            </div>
            <p className="font-semibold">{pageError}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#B8D58D] bg-white min-h-[400px] flex flex-col items-center justify-center text-xl text-qadder-dark/80 shadow-sm">
            لا توجد تقارير
          </div>
        ) : (
          <div className="rounded-[32px] border border-[#E8E9DC] bg-white p-4 shadow-sm sm:p-6">
            <div className="space-y-5">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  className="rounded-[28px] border border-[#E8E9DC] bg-white p-4 shadow-sm sm:p-5"
                >

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 text-right">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DDF4D8] text-[17px] font-bold text-[#12823A]">
                        {index + 1}
                      </span>

                      <span className="text-[18px] font-bold text-qadder-dark">
                        التقرير
                      </span>
                    </div>

                    {/* Case number */}
                    <InfoRow
                      label="رقم الحالة"
                      value={report.case_number || "-"}
                    />
                    {/* Car name */}
                    <InfoRow
                      label="اسم السيارة"
                      value={report.vehicle_name || "اسم السيارة غير متوفر"}
                    />

                    {/* Created date */}
                    <InfoRow
                      label="تاريخ الإنشاء"
                      value={formatDate(report.created_at)}
                    />

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">


                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="inline-flex h-[58px] w-full items-center justify-center gap-2 rounded-[20px] bg-qadder-primary px-5 text-[16px] font-bold text-white transition hover:bg-qadder-dark"
                      >
                        <Download size={20} />
                        تنزيل التقرير
                      </button>
                      <button
                        onClick={() => handleViewReport(report)}
                        className="inline-flex h-[58px] w-full items-center justify-center gap-2 rounded-[20px] border border-qadder-primary bg-white px-5 text-[16px] font-bold text-qadder-primary transition hover:bg-qadder-light"
                      >
                        <Eye size={20} />
                        عرض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <ContactUs />
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3 text-right">
      <div className="flex items-center gap-2 flex-wrap" dir="rtl">
        <span className="text-sm font-bold text-qadder-dark whitespace-nowrap">
          {label}:
        </span>

        <span className="text-sm text-qadder-dark/80" dir="auto">
          {value}
        </span>
      </div>
    </div>
  );
}