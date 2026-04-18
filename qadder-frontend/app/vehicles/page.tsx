"use client";

import React, { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";



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
                <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />

                <section className="mx-auto max-w-7xl px-6 py-16">
                    <PageLoader text=" جاري تحميل المركبات..." />
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
                contactHref="#contact"
            />


            {/* Hero */}
            <section className="relative overflow-hidden border-b border-qadder-border/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

                <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">

                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-2xl text-right">
                            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
                                مركباتي                            </h1>

                            <p className="mt-4 text-base leading-8 text-qadder-dark/70 md:text-lg">
                                استعرض مركباتك المسجلة وقم بإضافة مركبة جديدة بسهولة                            </p>
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
                                        <div className="flex items-start justify-between">
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
                                        <button
                                            className="flex items-center gap-2 rounded-full bg-qadder-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-qadder-primary hover:text-white"
                                        >
                                            ✏️ تعديل المركبة
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <ContactUs />

        </main>
    );
}