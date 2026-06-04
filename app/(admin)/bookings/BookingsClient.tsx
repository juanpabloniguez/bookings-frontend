"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking, BookingStatus, CreateBookingDto, UpdateBookingDto } from "@/lib/api";
import { createAppointment, deleteAppointment, getBusinesses, getCustomers, updateAppointment } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { filterAppointmentsByBusiness, filterCustomersByBusiness, filterBusinessesForUser } from "@/lib/businessFilter";
import type { Business, Customer } from "@/lib/types";

type BookingFormState = {
  date: string;
  time: string;
  status: BookingStatus;
  customerName: string;
  businessName: string;
  serviceName: string;
};

const EMPTY_FORM: BookingFormState = {
  date: "",
  time: "",
  status: "pending",
  customerName: "",
  businessName: "",
  serviceName: "",
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function resolveBookingPayload(
  form: BookingFormState,
  customers: Customer[],
  businesses: Business[]
): CreateBookingDto | null {
  const customer = customers.find((item) => normalizeName(item.name) === normalizeName(form.customerName));
  const business = businesses.find((item) => normalizeName(item.name) === normalizeName(form.businessName));

  if (!customer || !business) {
    return null;
  }

  return {
    date: form.date,
    time: form.time,
    status: form.status,
    customerId: customer.id,
    businessId: business.businessID,
    serviceName: form.serviceName,
    customerName: customer.name,
    businessName: business.name,
  };
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useLanguage();
  const label =
    status === "pending" ? t("status.pending") :
    status === "confirmed" ? t("status.confirmed") :
    t("status.paid_fem");
  return <span className={`badge badge--${status}`}>{label}</span>;
}

function formatDate(date: string, lang: string) {
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(date));
  } catch { return date; }
}

// ── Modal crear ──────────────────────────────────────────────────────────────

function NewBookingModal({
  onClose,
  onCreated,
  customers,
  businesses,
}: {
  onClose: () => void;
  onCreated: (b: Booking) => void;
  customers: Customer[];
  businesses: Business[];
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<BookingFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit() {
    if (!form.date || !form.time || !form.serviceName || !form.customerName || !form.businessName) {
      setError(t("bookings.form.error.create"));
      return;
    }

    const payload = resolveBookingPayload(form, customers, businesses);
    if (!payload) {
      setError(t("bookings.form.error.resolve"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await createAppointment(payload);
      onCreated(created);
      onClose();
    } catch {
      setError(t("bookings.form.error.create"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{t("bookings.form.title")}</p>
        <p className="modal-text">{t("bookings.subtitle")}</p>

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.date")}</label>
            <input className="input" name="date" type="date" value={form.date} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.time")}</label>
            <input className="input" name="time" type="time" value={form.time} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.status")}</label>
            <select className="select" name="status" value={form.status} onChange={handleChange}>
              <option value="pending">{t("status.pending")}</option>
              <option value="confirmed">{t("status.confirmed")}</option>
              <option value="paid">{t("status.paid_fem")}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.customerName")}</label>
            <select className="select" name="customerName" value={form.customerName} onChange={handleChange}>
              <option value="">{t("bookings.form.customerName.placeholder")}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name}>{customer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.businessName")}</label>
            <select className="select" name="businessName" value={form.businessName} onChange={handleChange}>
              <option value="">{t("bookings.form.businessName.placeholder")}</option>
              {businesses.map((business) => (
                <option key={business.businessID} value={business.name}>{business.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.serviceName")}</label>
            <input className="input" name="serviceName" type="text" value={form.serviceName} onChange={handleChange} />
          </div>
        </div>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>{t("customers.form.cancel")}</button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? t("customers.form.saving") : t("bookings.form.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal editar ─────────────────────────────────────────────────────────────

function EditBookingModal({
  booking,
  onClose,
  onUpdated,
  customers,
  businesses,
}: {
  booking: Booking;
  onClose: () => void;
  onUpdated: (b: Booking) => void;
  customers: Customer[];
  businesses: Business[];
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<BookingFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerName: booking.customerName ?? customers.find((customer) => customer.id === booking.customerId)?.name ?? "",
      businessName: booking.businessName ?? businesses.find((business) => business.businessID === booking.businessId)?.name ?? "",
      serviceName: booking.serviceName,
    });
  }, [booking, customers, businesses]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit() {
    const payload = resolveBookingPayload(form, customers, businesses);
    if (!payload) {
      setError(t("bookings.form.error.resolve"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await updateAppointment(booking.id, payload as UpdateBookingDto);
      onUpdated(updated);
      onClose();
    } catch {
      setError(t("bookings.form.error.update"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{t("bookings.form.edit")} #{booking.id}</p>
        <p className="modal-text">{t("bookings.subtitle")}</p>

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.date")}</label>
            <input className="input" name="date" type="date" value={form.date} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.time")}</label>
            <input className="input" name="time" type="time" value={form.time} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.status")}</label>
            <select className="select" name="status" value={form.status} onChange={handleChange}>
              <option value="pending">{t("status.pending")}</option>
              <option value="confirmed">{t("status.confirmed")}</option>
              <option value="paid">{t("status.paid_fem")}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.customerName")}</label>
            <select className="select" name="customerName" value={form.customerName} onChange={handleChange}>
              <option value="">{t("bookings.form.customerName.placeholder")}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name}>{customer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.businessName")}</label>
            <select className="select" name="businessName" value={form.businessName} onChange={handleChange}>
              <option value="">{t("bookings.form.businessName.placeholder")}</option>
              {businesses.map((business) => (
                <option key={business.businessID} value={business.name}>{business.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("bookings.form.serviceName")}</label>
            <input className="input" name="serviceName" type="text" value={form.serviceName} onChange={handleChange} />
          </div>
        </div>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>{t("customers.form.cancel")}</button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? t("customers.form.saving") : t("bookings.form.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal eliminar ───────────────────────────────────────────────────────────

function DeleteBookingModal({
  bookingId,
  onClose,
  onDeleted,
}: {
  bookingId: number;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await deleteAppointment(bookingId);
      onDeleted(bookingId);
      onClose();
    } catch {
      setError(t("bookings.form.error.delete"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">!</div>
        <h3 className="modal-title">{t("bookings.delete.title")}</h3>
        <p className="modal-text">{t("bookings.delete.text")}{bookingId}? {t("bookings.delete.confirm")}</p>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>{t("customers.form.cancel")}</button>
          <button className="danger-btn" onClick={handleDelete} disabled={loading}>
            {loading ? t("bookings.delete.deleting") : t("bookings.delete.action")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta reserva ──────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onEdit,
  onDelete,
  customerName,
  businessName,
}: {
  booking: Booking;
  onEdit: (b: Booking) => void;
  onDelete: (id: number) => void;
  customerName: string;
  businessName: string;
}) {
  const { lang, t } = useLanguage();

  return (
    <div className="customer-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p className="customer-name">#{booking.id} · {booking.serviceName}</p>
        <StatusBadge status={booking.status} />
      </div>
      <p className="customer-meta">{formatDate(booking.date, lang)} · {booking.time}</p>
      <p className="customer-meta">{t("bookings.customer_label")}: {customerName} · {t("bookings.business_label")}: {businessName}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="secondary-btn btn-edit" style={{ flex: 1 }} onClick={() => onEdit(booking)}>{t("bookings.action.edit")}</button>
        <button className="danger-btn" style={{ flex: 1 }} onClick={() => onDelete(booking.id)}>{t("bookings.action.delete")}</button>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    // Apply business filters to initial bookings
    const filteredBookings = filterAppointmentsByBusiness(initialBookings);
    setBookings(filteredBookings);
  }, [initialBookings]);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [customerList, businessList] = await Promise.all([getCustomers(), getBusinesses()]);
        const filteredCustomers = filterCustomersByBusiness(customerList);
        const filteredBusinesses = filterBusinessesForUser(businessList);
        setCustomers(filteredCustomers);
        setBusinesses(filteredBusinesses);
      } catch (error) {
        console.error("Error cargando catálogos para reservas", error);
      }
    }

    void loadCatalogs();
  }, []);

  const customerNameById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer.name])), [customers]);
  const businessNameById = useMemo(() => new Map(businesses.map((business) => [business.businessID, business.name])), [businesses]);

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const paidCount = bookings.filter((b) => b.status === "paid").length;

  // Filtered bookings based on status and search
  const filtered = useMemo(() => {
    return bookings
      .filter((b) => statusFilter === "all" || b.status === statusFilter)
      .filter((b) =>
        [b.serviceName, String(b.customerId), String(b.businessId)]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [bookings, statusFilter, search]);

  // Pagination calculations
  const paginatedBookings = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  // Reset pagination limit when filter changes
  useEffect(() => {
    setVisibleCount(12);
  }, [search, statusFilter]);
  return (
    <>
      {showCreate && (
        <NewBookingModal
          onClose={() => setShowCreate(false)}
          customers={customers}
          businesses={businesses}
          onCreated={(b) => {
            setBookings((prev) => [b, ...prev]);
          }}
        />
      )}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          customers={customers}
          businesses={businesses}
          onClose={() => setEditingBooking(null)}
          onUpdated={(b) => {
            setBookings((prev) => prev.map((x) => x.id === b.id ? b : x));
          }}
        />
      )}
      {deletingId !== null && (
        <DeleteBookingModal
          bookingId={deletingId}
          onClose={() => setDeletingId(null)}
          onDeleted={(id) => {
            setBookings((prev) => prev.filter((x) => x.id !== id));
          }}
        />
      )}

      <div className="page-stack">
        <section className="page-hero">
          <div>
            <h2>{t("bookings.title")}</h2>
            <p>{t("bookings.subtitle")}</p>
          </div>
          <button className="primary-btn btn-primary-action" type="button" onClick={() => setShowCreate(true)}>
            {t("bookings.new")}
          </button>
        </section>

        <section className="kpi-grid">
          <div className="kpi-card">
            <p className="kpi-card__label">{t("bookings.total")}</p>
            <h3 className="kpi-card__value">{totalCount}</h3>
            <p className="kpi-card__meta">{t("bookings.total.meta")}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-card__label">{t("status.pending")}</p>
            <h3 className="kpi-card__value">{pendingCount}</h3>
            <p className="kpi-card__meta kpi-card__meta--warning">{t("bookings.pending.meta")}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-card__label">{t("status.confirmed")}</p>
            <h3 className="kpi-card__value">{confirmedCount}</h3>
            <p className="kpi-card__meta kpi-card__meta--positive">{t("bookings.confirmed.meta")}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-card__label">{t("status.paid_fem")}</p>
            <h3 className="kpi-card__value">{paidCount}</h3>
            <p className="kpi-card__meta">{t("bookings.paid.meta")}</p>
          </div>
        </section>

        <section className="section-card">
          <div className="search-row">
            <input
              className="input"
              placeholder={t("bookings.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-row" style={{ marginTop: 12 }}>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("all")}>{t("bookings.filter.all")}</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("pending")}>{t("status.pending")}</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("confirmed")}>{t("status.confirmed")}</button>
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("paid")}>{t("status.paid_fem")}</button>
          </div>
        </section>


        {filtered.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>{t("customers.empty")}</p>
        )}

        <section className="customer-grid">
          {paginatedBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              customerName={booking.customerName ?? customerNameById.get(booking.customerId) ?? `${t("bookings.customer_label")} #${booking.customerId}`}
              businessName={booking.businessName ?? businessNameById.get(booking.businessId) ?? `${t("bookings.business_label")} #${booking.businessId}`}
              onEdit={setEditingBooking}
              onDelete={setDeletingId}
            />
          ))}
        </section>

        {filtered.length > visibleCount && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setVisibleCount((prev) => prev + 12)}
            >
              {t("action.show_more")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}