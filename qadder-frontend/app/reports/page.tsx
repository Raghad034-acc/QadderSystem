"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";

type ReportItem = {
    id: string | number;
    case_number?: string;
    status?: string;
};

type UserData = {
    reports_count: number;
    reports: ReportItem[];
};

export default function ReportsPage() {
    const [user, setUser] = useState<UserData>({
        reports_count: 0,
        reports: [],
    });

    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);

            setUser({
                reports_count: parsedUser.reports_count || 0,
                reports: parsedUser.reports || [],
            });
        }

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-qadder-background text-qadder-dark">
                <AppNavbar isLoggedIn={true} />
                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                    <PageLoader text="جاري تحميل التقارير..." />
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

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm">

                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <span className="rounded-full bg-qadder-light px-4 py-2 text-sm font-semibold text-qadder-primary">
                            {user.reports_count} تقرير
                        </span>

                        <h2 className="text-right text-2xl font-bold text-qadder-dark">
                            التقارير السابقة
                        </h2>
                    </div>

                    {/* Empty State */}
                    {user.reports.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-qadder-border bg-qadder-background/40 p-10 text-center">
                            لا توجد تقارير حتى الآن
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">

                            {user.reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="rounded-2xl border border-qadder-border/20 bg-qadder-background/40 p-5 text-right"
                                >
                                    <p className="font-bold text-qadder-dark">
                                        رقم الحالة: {report.case_number || "غير متوفر"}
                                    </p>

                                    <p className="mt-2 text-sm text-qadder-dark/70">
                                        الحالة: {report.status || "غير محددة"}
                                    </p>
                                </div>
                            ))}

                        </div>
                    )}

                </div>
            </section>

            {/* Footer */}
            <div className="mt-16">
                <ContactUs />
            </div>
        </main>
    );
}