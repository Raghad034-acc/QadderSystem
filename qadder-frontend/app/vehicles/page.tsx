"use client";

import React, { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";

type User = {
    auth_account_id?: string;
    user_profile_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
};

type Vehicle = {
    id: string;
    brand: string;
    model: string;
    year: number;
    color?: string;
    plate_number: string;
};

export default function VehiclesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");

            if (!storedUser) {
                window.location.href = "/login";
                return;
            }

            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
        } catch (err) {
            console.error("Error reading user from localStorage:", err);
            setError("تعذر قراءة بيانات المستخدم");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        if (!user.user_profile_id) {
            setError("معرف المستخدم غير موجود");
            setLoading(false);
            return;
        }

        const fetchVehicles = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await fetch(
                    `http://127.0.0.1:8000/vehicles/user/${user.user_profile_id}`
                );

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                setVehicles(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching vehicles:", err);
                setError("فشل في تحميل المركبات");
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const handleAddVehicle = () => {
        window.location.href = "/add-vehicle";
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-qadder-background text-qadder-dark">
                <section className="mx-auto max-w-7xl px-6 py-16">
                    <div className="rounded-[28px] border border-qadder-border/20 bg-white p-12 text-center shadow-sm">
                        <p className="text-lg font-semibold text-qadder-dark/70">
                            جاري تحميل المركبات...
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-qadder-background text-qadder-dark">
                <section className="mx-auto max-w-7xl px-6 py-16">
                    <div className="rounded-[28px] border border-red-200 bg-red-50 p-12 text-center shadow-sm">
                        <p className="text-lg font-semibold text-red-600">{error}</p>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-qadder-background text-qadder-dark">
            {/* Header */}
         <AppNavbar
  isLoggedIn={true}
  handleLogout={handleLogout}
/>

            {/* Hero */}
            <section className="relative overflow-hidden border-b border-qadder-border/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

                <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">

                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-2xl text-right">
                            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
                                إدارة مركباتك بسهولة
                            </h1>

                            <p className="mt-4 text-base leading-8 text-qadder-dark/70 md:text-lg">
                                هنا تستعرض جميع المركبات المسجلة باسمك وبإمكانك اضافة مركبة جديدة
                            </p>
                        </div>

                        <div className="flex justify-start md:justify-end">
                            <button
                                onClick={() => (window.location.href = "/add-vehicle")} className="rounded-2xl bg-qadder-primary px-6 py-4 text-base font-bold text-white shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                + إضافة مركبة جديدة
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vehicles Section */}
            <section className="mx-auto max-w-7xl px-6 py-10">
                {vehicles.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-qadder-border bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-qadder-light text-4xl">
                            🚗
                        </div>

                        <h2 className="text-2xl font-bold text-qadder-dark">
                            لا يوجد مركبات مسجلة
                        </h2>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <span className="rounded-full bg-qadder-light px-4 py-2 text-sm font-semibold text-qadder-primary">
                                {vehicles.length} عدد المركبات
                            </span>

                            <h2 className="text-2xl font-bold text-qadder-dark text-right">
                                المركبات المسجلة
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {vehicles.map((vehicle) => (
                                <div
                                    key={vehicle.id}
                                    className="group overflow-hidden rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                        {/* Main Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-qadder-light text-4xl shadow-sm">
                                                🚘
                                            </div>

                                            <div className="text-right">
                                                <h3 className="text-2xl font-extrabold text-qadder-dark">
                                                    {vehicle.brand} {vehicle.model}
                                                </h3>

                                                <p className="mt-2 text-sm font-semibold text-qadder-primary">
                                                    رقم اللوحة: {vehicle.plate_number}
                                                </p>

                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid min-w-full grid-cols-2 gap-4 rounded-3xl bg-qadder-background/60 p-4 md:min-w-[420px]">
                                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                                <p className="text-xs font-semibold text-qadder-dark/50">
                                                    الماركة
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-qadder-dark">
                                                    {vehicle.brand}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                                <p className="text-xs font-semibold text-qadder-dark/50">
                                                    الموديل
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-qadder-dark">
                                                    {vehicle.model}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                                <p className="text-xs font-semibold text-qadder-dark/50">
                                                    السنة
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-qadder-dark">
                                                    {vehicle.year}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                                <p className="text-xs font-semibold text-qadder-dark/50">
                                                    اللون
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-qadder-dark">
                                                    {vehicle.color || "غير محدد"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                                        <button className="rounded-2xl bg-qadder-primary px-5 py-3 font-semibold text-white transition hover:opacity-90">
                                            تعديل المركبة
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
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