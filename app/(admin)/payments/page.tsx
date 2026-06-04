"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createPayment, deletePayment, getPayments, getCustomers, getBusinesses } from "@/lib/api";
import type { Customer, Business } from "@/lib/types";
import type { Payment, PaymentStatus } from "@/lib/types";
import { filterBusinessesForUser, filterCustomersByBusiness, filterPaymentsByBusinessWithCustomers } from "@/lib/businessFilter";

// Componentes de apoyo
function KpiCard({ title, value, subtitle, variant }: any) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p className={`kpi-card__meta ${variant === "positive" ? "kpi-card__meta--positive" : variant === "warning" ? "kpi-card__meta--warning" : ""}`}>
        {subtitle}
      </p>
    </div>
  );
}

function Badge({ status }: { status: PaymentStatus }) {
  const { t } = useLanguage();
  const isPaid = status === "completed";
  return (
    <span className={`badge ${isPaid ? "badge--confirmed" : "badge--pending"}`}>
      {status === "completed" ? t("status.paid") : t("status.pending")}
    </span>
  );
}

type PaymentMethodTranslationKey =
  | "payments.method.cash"
  | "payments.method.card"
  | "payments.method.transfer";

function getPaymentMethodLabel(method: string | undefined, t: (key: PaymentMethodTranslationKey) => string) {
  const normalized = (method ?? "").trim().toLowerCase();

  if (normalized === "efectivo" || normalized === "cash") return t("payments.method.cash");
  if (normalized === "tarjeta" || normalized === "card") return t("payments.method.card");
  if (normalized === "transferencia" || normalized === "bank transfer" || normalized === "transfer") return t("payments.method.transfer");

  return method ?? "";
}

function RegisterPaymentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    customerId: "",
    businessId: "",
    date: new Date().toISOString().split('T')[0],
    paymentMethod: "Efectivo",
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  function getCustomerBusinessId(customer: Customer, allBusinesses: Business[]): number | undefined {
    if (typeof customer.businessId === "number") return customer.businessId;

    const customerBusiness = (customer.business ?? "").trim().toLowerCase();
    const business = allBusinesses.find((b) => b.name.trim().toLowerCase() === customerBusiness);
    return business?.businessID;
  }

  useEffect(() => {
    (async () => {
      try {
        const [businessData, customerData] = await Promise.all([getBusinesses(), getCustomers()]);
        const visibleBusinesses = filterBusinessesForUser(businessData);
        const visibleCustomers = filterCustomersByBusiness(customerData);

        setBusinesses(visibleBusinesses);
        setCustomers(visibleCustomers);

        if (visibleBusinesses.length > 0) {
          const defaultBusinessId = String(visibleBusinesses[0].businessID);
          setForm((prev) => ({ ...prev, businessId: defaultBusinessId }));
        }
      } catch (e) {
        console.error('Failed to load payment data', e);
      }
    })();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    if (!form.businessId) return false;
    const customerBusinessId = getCustomerBusinessId(customer, businesses);
    return customerBusinessId === Number(form.businessId);
  });

  const selectedCustomer = filteredCustomers.find((c) => String(c.id) === form.customerId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "businessId") {
        return { ...prev, businessId: value, customerId: "" };
      }

      return { ...prev, [name]: value };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.amount || Number(form.amount) <= 0) {
      alert(t("payments.enter_amount"));
      return;
    }

    if (!form.businessId) {
      alert("Selecciona un negocio.");
      return;
    }

    if (!form.customerId.trim() || !selectedCustomer) {
      alert(t("payments.alert.enter_customer"));
      return;
    }

    setLoading(true);
    try {
      // Registramos el pago directamente en la tabla 'payment'
      await createPayment({
        amount: Number(form.amount),
        date: form.date,
        paymentMethod: form.paymentMethod,
        businessId: Number(form.businessId),
        status: "completed",
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        notes: "Cobro directo registrado desde el panel de pagos"
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error("Error al registrar cobro:", error);
      alert("Error: No se pudo conectar con el servidor para registrar el cobro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{t("payments.register")}</p>
        <p className="modal-text">{t("payments.subtitle")}</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Negocio
            </label>
            <select
              className="input"
              name="businessId"
              value={form.businessId}
              onChange={handleChange}
              required
              autoFocus
            >
              <option value="">Selecciona un negocio</option>
              {businesses.map((business) => (
                <option key={business.businessID} value={business.businessID}>{business.name}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("table.customer")}
            </label>
            <select
              className="input"
              name="customerId"
              value={form.customerId}
              onChange={handleChange}
              required
            >
              <option value="">{t("payments.select_customer")}</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.email && `(${c.email})`}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("table.amount")}
            </label>
            <input
              className="input"
              name="amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("table.date")}
            </label>
            <input
              className="input"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("payments.method.label")}
            </label>
            <select 
              className="input" 
              name="paymentMethod" 
              value={form.paymentMethod}
              onChange={handleChange as any}
            >
              <option value="Efectivo">{t("payments.method.cash")}</option>
              <option value="Tarjeta">{t("payments.method.card")}</option>
              <option value="Transferencia">{t("payments.method.transfer")}</option>
            </select>
          </div>

          <div className="modal-actions" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
              {t("customers.form.cancel")}
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? t("customers.form.saving") : t("payments.register")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeletePaymentModal({
  paymentId,
  onClose,
  onDeleted,
}: {
  paymentId: number;
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
      await deletePayment(paymentId);
      onDeleted(paymentId);
      onClose();
    } catch {
      setError(t("payments.delete.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">!</div>
        <h3 className="modal-title">{t("payments.delete.title")}</h3>
        <p className="modal-text">{t("payments.delete.text")}</p>
        <p className="modal-text" style={{ fontSize: 13, color: "var(--muted)", marginTop: -14 }}>
          {t("payments.delete.confirm")} (ID: #{paymentId})
        </p>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            {t("customers.form.cancel")}
          </button>
          <button className="danger-btn" onClick={handleDelete} disabled={loading}>
            {loading ? t("payments.delete.deleting") : t("payments.delete.action")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { t } = useLanguage();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  async function loadPayments() {
    try {
      const [paymentData, customerData] = await Promise.all([getPayments(), getCustomers()]);
      const filteredPayments = filterPaymentsByBusinessWithCustomers(paymentData, customerData);
      setPayments(filteredPayments);
      setVisibleCount(12);
    } catch (error) {
      console.error("Error cargando cobros", error);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, []);

  const handlePrint = (payment: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const statusText = payment.status === "completed" ? t("status.paid") : t("status.pending");
    const paymentMethodText = getPaymentMethodLabel(payment.paymentMethod, t);

    printWindow.document.write(`
      <html>
        <head><title>${t("receipt.title")} - ${payment.id}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="border: 1px solid #000; padding: 20px; max-width: 400px;">
            <h2 style="text-align: center;">${t("receipt.title")}</h2>
            <hr>
            <p><strong>${t("receipt.id")}:</strong> ${payment.id}</p>
            <p><strong>${t("receipt.bookingId")}:</strong> ${payment.appointmentId}</p>
            <p><strong>${t("table.customer")}:</strong> ${payment.customerName || `Cliente #${payment.customerId}`}</p>
            <p><strong>${t("table.amount")}:</strong> ${payment.amount} ${t("receipt.currency")}</p>
            <p><strong>${t("receipt.method")}:</strong> ${paymentMethodText}</p>
            <p><strong>${t("table.date")}:</strong> ${payment.date}</p>
            <p><strong>${t("table.status")}:</strong> ${statusText}</p>
            <hr>
            <p style="text-align: center;">${t("receipt.thanks")}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      {showModal && <RegisterPaymentModal onClose={() => setShowModal(false)} onCreated={loadPayments} />}
      {deletingId !== null && (
        <DeletePaymentModal
          paymentId={deletingId}
          onClose={() => setDeletingId(null)}
          onDeleted={(id) => {
            setPayments((prev) => prev.filter((p) => p.id !== id));
          }}
        />
      )}

      <div className="page-stack">
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <section className="page-hero no-print">
          <div>
            <h2>{t("payments.title")}</h2>
            <p>{t("payments.subtitle")}</p>
          </div>

          <button
            className="primary-btn btn-primary-action"
            type="button"
            onClick={() => setShowModal(true)}
          >
            {t("payments.register")}
          </button>
        </section>

        {payments.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>{t("customers.empty")}</p>
        )}

        {payments.length > 0 && (
          <>
            <section className="customer-grid">
              {payments.slice(0, visibleCount).map((p) => (
                <div key={p.id} className="customer-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <p className="customer-name">#{p.id} · {p.customerName || `Cliente #${p.customerId}`}</p>
                    <Badge status={p.status} />
                  </div>
                  <p className="customer-meta">{p.date}</p>
                  <div className="customer-tag">{p.amount} {t("receipt.currency")} · {getPaymentMethodLabel(p.paymentMethod, t)}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="secondary-btn btn-edit" style={{ flex: 1 }} onClick={() => handlePrint(p)}>{t("action.print")}</button>
                    <button className="danger-btn" style={{ flex: 1 }} onClick={() => setDeletingId(p.id)}>{t("bookings.delete.action")}</button>
                  </div>
                </div>
              ))}
            </section>

            {payments.length > visibleCount && (
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
          </>
        )}
      </div>
    </>
  );
};
