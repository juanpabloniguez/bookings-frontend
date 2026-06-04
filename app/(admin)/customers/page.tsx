"use client";

import { useEffect, useState } from "react";
import { createCustomer, deleteCustomer, getCustomers, updateCustomer, getBusinesses } from "@/lib/api";
import type { Customer, Business } from "@/lib/types";
import type { CreateCustomerDto, UpdateCustomerDto } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { filterCustomersByBusiness, filterBusinessesForUser } from "@/lib/businessFilter";

const EMPTY_FORM: CreateCustomerDto = {
  name: "",
  phone: "",
  email: "",
  businessId: 0,
};

function NewCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Customer) => void;
}) {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [form, setForm] = useState<CreateCustomerDto>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBusinesses()
      .then((data) => {
        const filteredBusinesses = filterBusinessesForUser(data);
        setBusinesses(filteredBusinesses);
        if (filteredBusinesses.length > 0) {
          setForm((prev) => ({ ...prev, businessId: filteredBusinesses[0].businessID }));
        }
      })
      .catch(() => setError("Error al cargar los negocios."));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "businessId" ? Number(value) : value,
    }));
  }

  async function handleSubmit() {
    if (!form.name || !form.businessId) {
      setError(t("customers.form.error.required"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createCustomer(form);
      onCreated(created);
      onClose();
    } catch {
      setError(t("customers.form.error.create"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{t("customers.modal.title")}</p>
        <p className="modal-text">{t("customers.modal.text")}</p>

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.name")}
            </label>
            <input
              className="input"
              name="name"
              placeholder="María López"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.phone")}
            </label>
            <input
              className="input"
              name="phone"
              placeholder="600 123 456"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.email")}
            </label>
            <input
              className="input"
              name="email"
              type="email"
              placeholder="maria@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.business")}
            </label>
            <select
              className="select"
              name="businessId"
              value={form.businessId}
              onChange={handleChange}
            >
              {businesses.length === 0 ? (
                <option value={0}>Cargando negocios...</option>
              ) : (
                businesses.map((b) => (
                  <option key={b.businessID} value={b.businessID}>
                    {b.name} (ID: {b.businessID})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            {t("customers.form.cancel")}
          </button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? t("customers.form.saving") : t("customers.form.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCustomerModal({
  customer,
  onClose,
  onUpdated,
}: {
  customer: Customer;
  onClose: () => void;
  onUpdated: (c: Customer) => void;
}) {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [form, setForm] = useState<CreateCustomerDto>({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    businessId: customer.businessId || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBusinesses()
      .then((data) => {
        const filteredBusinesses = filterBusinessesForUser(data);
        setBusinesses(filteredBusinesses);
        if (!form.businessId && filteredBusinesses.length > 0) {
          setForm((prev) => ({ ...prev, businessId: filteredBusinesses[0].businessID }));
        }
      })
      .catch(() => setError("Error al cargar los negocios."));
  }, [form.businessId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "businessId" ? Number(value) : value,
    }));
  }

  async function handleSubmit() {
    if (!form.name || !form.businessId) {
      setError(t("customers.form.error.required"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: UpdateCustomerDto = { ...form };
      const updated = await updateCustomer(customer.id, payload);
      onUpdated(updated);
      onClose();
    } catch {
      setError("Error al editar el cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{t("bookings.form.edit") || "Editar cliente"} #{customer.id}</p>
        <p className="modal-text">{t("customers.modal.text")}</p>

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.name")}
            </label>
            <input className="input" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.phone")}
            </label>
            <input className="input" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.email")}
            </label>
            <input className="input" name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("customers.form.business")}
            </label>
            <select
              className="select"
              name="businessId"
              value={form.businessId}
              onChange={handleChange}
            >
              {businesses.length === 0 ? (
                <option value={0}>Cargando negocios...</option>
              ) : (
                businesses.map((b) => (
                  <option key={b.businessID} value={b.businessID}>
                    {b.name} (ID: {b.businessID})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            {t("customers.form.cancel")}
          </button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? t("customers.form.saving") : t("bookings.form.save") || "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteCustomerModal({
  customer,
  onClose,
  onDeleted,
}: {
  customer: Customer;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isJose = customer.name.toLowerCase() === "jose";

  async function handleDelete() {
    if (isJose) return;
    setLoading(true);
    setError(null);
    try {
      await deleteCustomer(customer.id);
      onDeleted(customer.id);
      onClose();
    } catch {
      setError(t("customers.delete.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {isJose ? (
          <>
            <div className="modal-icon" style={{ background: "#fef3c7", color: "#d97706" }}>!</div>
            <h3 className="modal-title">{t("customers.delete.title")}</h3>
            <p className="modal-text">{t("customers.delete.jose_warning")}</p>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={onClose}>
                {t("customers.form.cancel")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-icon">!</div>
            <h3 className="modal-title">{t("customers.delete.title")}</h3>
            <p className="modal-text">{t("customers.delete.text")}</p>
            <p className="modal-text" style={{ fontSize: 13, color: "var(--muted)", marginTop: -14 }}>
              {t("customers.delete.confirm")}
            </p>

            {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

            <div className="modal-actions">
              <button className="secondary-btn" onClick={onClose} disabled={loading}>
                {t("customers.form.cancel")}
              </button>
              <button className="danger-btn" onClick={handleDelete} disabled={loading}>
                {loading ? t("customers.delete.deleting") : t("customers.delete.action")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CustomerCard({
  customer,
  onEdit,
  onDeleteRequest,
}: {
  customer: Customer;
  onEdit: (c: Customer) => void;
  onDeleteRequest: (c: Customer) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="customer-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p className="customer-name">#{customer.id} · {customer.name}</p>
      </div>
      <p className="customer-meta">{customer.phone}</p>
      <p className="customer-meta">{customer.email}</p>
      <div className="customer-tag">{customer.business}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          className="secondary-btn btn-edit"
          style={{ flex: 1 }}
          onClick={() => onEdit(customer)}
        >
          {t("bookings.action.edit") || "Editar"}
        </button>
        <button
          className="danger-btn"
          style={{ flex: 1 }}
          onClick={() => onDeleteRequest(customer)}
        >
          {t("customers.delete.action")}
        </button>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    getCustomers()
      .then((data) => {
        const filtered = filterCustomersByBusiness(data);
        setCustomers(filtered);
      })
      .catch(() => setError(t("customers.error.load")))
      .finally(() => setLoading(false));
  }, [t]);

  // Reset visible items when search query changes
  useEffect(() => {
    setVisibleCount(12);
  }, [search]);

  const filtered = customers.filter((c) =>
    [c.name, c.email, c.phone, c.business]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      {showModal && (
        <NewCustomerModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => setCustomers((prev) => [c, ...prev])}
        />
      )}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onUpdated={(c) => {
            setCustomers((prev) => prev.map((x) => (x.id === c.id ? c : x)));
          }}
        />
      )}
      {deletingCustomer && (
        <DeleteCustomerModal
          customer={deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onDeleted={(id) => setCustomers((prev) => prev.filter((c) => c.id !== id))}
        />
      )}

      <div className="page-stack">
        <section className="page-hero">
          <div>
            <h2>{t("customers.title")}</h2>
            <p>{t("customers.subtitle")}</p>
          </div>
          <button className="primary-btn btn-primary-action" type="button" onClick={() => setShowModal(true)}>
            {t("customers.new")}
          </button>
        </section>

        <section className="section-card">
          <div className="search-row">
            <input
              className="input"
              placeholder={t("customers.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {loading && <p style={{ color: "var(--muted)", textAlign: "center" }}>{t("customers.loading")}</p>}
        {error && <p className="message-error">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>{t("customers.empty")}</p>
        )}

        {!loading && (
          <>
            <section className="customer-grid">
              {filtered.slice(0, visibleCount).map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={setEditingCustomer}
                  onDeleteRequest={setDeletingCustomer}
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
          </>
        )}
      </div>
    </>
  );
}