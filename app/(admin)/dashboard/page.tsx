"use client";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getAppointments, getCustomers, getBusinesses, getPayments, type Booking } from "@/lib/api";
import type { Customer, Business, Payment } from "@/lib/types";
import { filterAppointmentsByBusiness, filterCustomersByBusiness, filterPaymentsByBusinessWithCustomers } from "@/lib/businessFilter";
import { ExportButton } from "./ExportButton";

type DashboardBookingStatus = "pending" | "confirmed" | "paid";

type DashboardBooking = {
  time: string;
  client: string;
  business: string;
  service: string;
  status: DashboardBookingStatus;
};

function Badge({ status }: { status: DashboardBookingStatus }) {
  const { t } = useLanguage();
  const label =
    status === "pending"
      ? t("status.pending")
      : status === "confirmed"
        ? t("status.confirmed")
        : t("status.paid_fem");

  return <span className={`badge badge--${status}`}>{label}</span>;
}

function KpiCard({
  title,
  value,
  subtitle,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  variant?: "positive" | "warning";
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p
        className={`kpi-card__meta ${
          variant === "positive"
            ? "kpi-card__meta--positive"
            : variant === "warning"
              ? "kpi-card__meta--warning"
              : ""
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllBookings, setShowAllBookings] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [appData, custData, bizData, payData] = await Promise.all([
          getAppointments(),
          getCustomers(),
          getBusinesses(),
          getPayments(),
        ]);
        
        // Apply business filters
        const filteredAppts = filterAppointmentsByBusiness(appData);
        const filteredCustomers = filterCustomersByBusiness(custData);
        const filteredPayments = filterPaymentsByBusinessWithCustomers(payData, custData);
        
        setAppointments(filteredAppts);
        setCustomers(filteredCustomers);
        setBusinesses(bizData);
        setPayments(filteredPayments);
      } catch (error) {
        console.error("Error cargando datos del panel", error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
  const businessMap = useMemo(() => new Map(businesses.map((b) => [b.businessID, b.name])), [businesses]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Determine active date: use today if today has bookings, otherwise find the closest date with bookings
  const activeDate = useMemo(() => {
    if (appointments.length === 0) return today;
    const hasToday = appointments.some((a) => a.date === today && !a.serviceName.includes("Cobro"));
    if (hasToday) return today;

    const validApps = appointments.filter((a) => !a.serviceName.includes("Cobro"));
    if (validApps.length === 0) return today;

    // Find the next upcoming booking from today
    const upcoming = validApps.find((a) => a.date >= today);
    if (upcoming) return upcoming.date;

    // Fallback to the latest booking date in the past
    return validApps[validApps.length - 1].date;
  }, [appointments, today]);

  const todayBookings = useMemo<DashboardBooking[]>(() => {
    return appointments
      .filter((appointment) => appointment.date === activeDate && !appointment.serviceName.includes("Cobro"))
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((appointment) => {
        const clientName = customerMap.get(appointment.customerId) ?? `${t("dashboard.customer_label")} #${appointment.customerId}`;
        const businessName = businessMap.get(appointment.businessId) ?? `${t("dashboard.business_label")} #${appointment.businessId}`;
        return {
          time: appointment.time,
          client: clientName,
          business: businessName,
          service: appointment.serviceName,
          status: appointment.status,
        };
      });
  }, [appointments, customerMap, businessMap, activeDate, t]);

  const allBookings = useMemo<DashboardBooking[]>(() => {
    return appointments
      .filter((appointment) => !appointment.serviceName.includes("Cobro"))
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      })
      .map((appointment) => {
        const clientName = customerMap.get(appointment.customerId) ?? `${t("dashboard.customer_label")} #${appointment.customerId}`;
        const businessName = businessMap.get(appointment.businessId) ?? `${t("dashboard.business_label")} #${appointment.businessId}`;
        return {
          time: `${appointment.date} · ${appointment.time}`,
          client: clientName,
          business: businessName,
          service: appointment.serviceName,
          status: appointment.status,
        };
      });
  }, [appointments, customerMap, businessMap, t]);

  const displayedBookings = showAllBookings ? allBookings : todayBookings;

  // Real database metrics calculation
  const totalPendingCount = useMemo(() => {
    return appointments.filter((a) => a.status === "pending").length;
  }, [appointments]);

  // Real completed payments sum from the payments table
  const { totalPaidAmount, completedPaymentsCount } = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed" && p.date === today);
    const sum = completed.reduce((acc, p) => acc + p.amount, 0);
    return {
      totalPaidAmount: sum,
      completedPaymentsCount: completed.length,
    };
  }, [payments, today]);

  // Active Customers: count of registered customers in DB
  const activeCustomers = customers.length;

  // Group all appointments by businessId to find the featured business with most bookings
  const featuredBusinessData = useMemo(() => {
    if (appointments.length === 0 || businesses.length === 0) {
      return { name: t("dashboard.no_bookings"), count: 0 };
    }

    const counts: Record<number, number> = {};
    appointments.forEach((a) => {
      counts[a.businessId] = (counts[a.businessId] || 0) + 1;
    });

    let maxId = -1;
    let maxCount = -1;
    for (const [idStr, count] of Object.entries(counts)) {
      const id = Number(idStr);
      if (count > maxCount) {
        maxCount = count;
        maxId = id;
      }
    }

    const name = businessMap.get(maxId) ?? `${t("dashboard.business_label")} #${maxId}`;
    return { name, count: maxCount };
  }, [appointments, businessMap, businesses, t]);

  const kpis = [
    {
      title: t("dashboard.kpi.bookings"),
      value: String(todayBookings.length),
      subtitle: `Fecha: ${activeDate}`,
      variant: "positive" as const,
    },
    {
      title: t("dashboard.kpi.revenue"),
      value: `${(() => {
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalPaidAmount);
        return lang === "es"
          ? formatted.replace(/\./g, "_").replace(/,/g, ".").replace(/_/g, ",")
          : formatted;
      })()} €`,
      subtitle: `${completedPaymentsCount} ${completedPaymentsCount === 1 ? t("dashboard.payment_recorded") : t("dashboard.payments_recorded")}`,
    },
    {
      title: t("dashboard.kpi.pending"),
      value: String(totalPendingCount),
      subtitle: t("dashboard.kpi.pending.meta"),
      variant: totalPendingCount > 0 ? ("warning" as const) : undefined,
    },
    {
      title: t("dashboard.kpi.customers"),
      value: String(activeCustomers),
      subtitle: t("dashboard.kpi.customers.meta"),
    },
  ];

  if (loading) {
    return (
      <div className="page-stack" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="spinner"></div>
          <p style={{ color: "var(--muted)" }}>{t("dashboard.loading")}</p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #6C63FF;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>{t("dashboard.title")}</h2>
          <p>{t("dashboard.subtitle")}</p>
        </div>

        <ExportButton
          bookings={todayBookings}
          kpis={kpis.map(({ title, value, subtitle }) => ({ title, value, subtitle }))}
        />
      </section>

      <section className="kpi-grid">
        <KpiCard
          title={kpis[0].title}
          value={kpis[0].value}
          subtitle={kpis[0].subtitle}
          variant={kpis[0].variant}
        />
        <KpiCard 
          title={kpis[1].title} 
          value={kpis[1].value} 
          subtitle={kpis[1].subtitle} 
        />
        <KpiCard
          title={kpis[2].title}
          value={kpis[2].value}
          subtitle={kpis[2].subtitle}
          variant={kpis[2].variant}
        />
        <KpiCard 
          title={kpis[3].title} 
          value={kpis[3].value} 
          subtitle={kpis[3].subtitle} 
        />
      </section>

      <section className="dashboard-grid">
        <div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">{showAllBookings ? t("bookings.title") : t("dashboard.next")}</h3>
            <button
              className="panel-subtle-link"
              type="button"
              onClick={() => setShowAllBookings((current) => !current)}
            >
              {showAllBookings ? t("dashboard.viewUpcoming") : t("dashboard.viewAll")}
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>{t("table.time")}</th>
                <th>{t("table.customer")}</th>
                <th>{t("table.business")}</th>
                <th>{t("table.service")}</th>
                <th>{t("table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {displayedBookings.map((booking, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>{booking.time}</td>
                  <td>{booking.client}</td>
                  <td>{booking.business}</td>
                  <td>{booking.service}</td>
                  <td>
                    <Badge status={booking.status} />
                  </td>
                </tr>
              ))}
              {displayedBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>
                    {t("dashboard.no_bookings_today")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="info-stack">
          <div className="info-box">
            <p className="info-box__eyebrow">{t("dashboard.info.next")}</p>
            <p className="info-box__title">
              {todayBookings[0]?.client ?? t("dashboard.no_bookings")}
            </p>
            <p className="info-box__text">
              {todayBookings[0] ? `${todayBookings[0].time} · ${todayBookings[0].business}` : t("dashboard.no_bookings_today")}
            </p>
          </div>

          <div className="info-box">
            <p className="info-box__eyebrow">{t("dashboard.info.featured")}</p>
            <p className="info-box__title">{featuredBusinessData.name}</p>
            <p className="info-box__text">
              {featuredBusinessData.count} {featuredBusinessData.count === 1 ? "reserva registrada" : "reservas registradas"}
            </p>
          </div>

          <div className="info-box">
            <p className="info-box__eyebrow">{t("dashboard.info.reminders")}</p>
            <p className="info-box__title">{totalPendingCount} pendientes</p>
            <p className="info-box__text">{t("dashboard.info.reminders.text")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}