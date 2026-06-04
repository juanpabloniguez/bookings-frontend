"use client";

import { useEffect, useState } from "react";
import { createBusiness, getBusinesses, deleteBusiness, updateBusiness } from "@/lib/api";
import type { Business } from "@/lib/types";
import type { CreateBusinessDto, UpdateBusinessDto } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const EMPTY_FORM: CreateBusinessDto = {
  name: "",
};

function NewBusinessModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: Business) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CreateBusinessDto>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name) {
      setError(t("businesses.form.error.required"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createBusiness(form);
      onCreated(created);
      onClose();
    } catch {
      setError(t("businesses.form.error.create"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{t("businesses.modal.title")}</p>
        <p className="modal-text">{t("businesses.modal.text")}</p>

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              {t("businesses.form.name")}
            </label>
            <input
              className="input"
              name="name"
              placeholder="Peluquería Nova"
              value={form.name}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            {t("businesses.form.cancel")}
          </button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? t("businesses.form.saving") : t("businesses.form.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditBusinessModal({
  business,
  onSaved,
  onClose,
}: {
  business: Business;
  onSaved: (b: Business) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CreateBusinessDto>({ name: business.name });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError(t("businesses.form.error.required"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: UpdateBusinessDto = { name: form.name.trim() };
      const updated = await updateBusiness(business.businessID, payload);
      onSaved(updated);
      onClose();
    } catch {
      setError(t("businesses.edit.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{t("businesses.edit.title")}</p>
        <p className="modal-text">{t("businesses.edit.text")}</p>

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>ID</label>
            <div className="customer-tag">#{business.businessID}</div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("businesses.form.name")}</label>
            <input
              className="input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Peluquería Nova"
            />
          </div>
        </div>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            {t("businesses.form.cancel")}
          </button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? t("businesses.edit.saving") : t("businesses.edit.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteBusinessModal({
  business,
  onClose,
  onDeleted,
}: {
  business: Business;
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
      await deleteBusiness(business.businessID);
      onDeleted(business.businessID);
      onClose();
    } catch {
      setError(t("businesses.delete.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">!</div>
        <h3 className="modal-title">{t("businesses.delete.title")}</h3>
        <p className="modal-text">{t("businesses.delete.text")}</p>
        <p className="modal-text" style={{ fontSize: 13, color: "var(--muted)", marginTop: -14 }}>
          {t("businesses.delete.confirm")}
        </p>

        {error && <p className="message-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            {t("businesses.form.cancel")}
          </button>
          <button className="danger-btn" onClick={handleDelete} disabled={loading}>
            {loading ? t("businesses.delete.deleting") : t("businesses.delete.action")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BusinessCard({
  business,
  onDeleteRequest,
  onUpdated,
}: {
  business: Business;
  onDeleteRequest: (business: Business) => void;
  onUpdated: (business: Business) => void;
}) {
  const { t } = useLanguage();
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      {showEdit && (
        <EditBusinessModal
          business={business}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => onUpdated(updated)}
        />
      )}
      <div className="customer-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <p className="customer-name">#{business.businessID} · {business.name}</p>
        </div>
        <p className="customer-meta">ID: {business.businessID}</p>
        {business.email && (
          <p className="customer-meta" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <i className="bi bi-envelope" style={{ fontSize: 13 }}></i>
            <span>Contacto: {business.email}</span>
          </p>
        )}
        <div className="customer-tag">{t("nav.businesses")}</div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            className="secondary-btn btn-edit"
            style={{ flex: 1 }}
            onClick={() => setShowEdit(true)}
          >
            {t("businesses.edit.action")}
          </button>
          <button
            onClick={() => onDeleteRequest(business)}
            className="danger-btn"
            style={{ flex: 1 }}
          >
            {t("businesses.delete.action")}
          </button>
        </div>
      </div>
    </>
  );
}

export default function BusinessesPage() {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const loadBusinesses = async () => {
    try {
      const data = await getBusinesses();
      setBusinesses(data);
      setError(null);
    } catch {
      setError(t("businesses.error.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBusinesses();
  }, [t]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void loadBusinesses();
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [t]);

  // Reset visible items when search query changes
  useEffect(() => {
    setVisibleCount(12);
  }, [search]);

  const filtered = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {showModal && (
        <NewBusinessModal
          onClose={() => setShowModal(false)}
          onCreated={(b) => setBusinesses((prev) => [...prev, b])}
        />
      )}
      {deletingBusiness && (
        <DeleteBusinessModal
          business={deletingBusiness}
          onClose={() => setDeletingBusiness(null)}
          onDeleted={(id) => setBusinesses((prev) => prev.filter(b => b.businessID !== id))}
        />
      )}

      <div className="page-stack">
        <section className="page-hero">
          <div>
            <h2>{t("businesses.title")}</h2>
            <p>{t("businesses.subtitle")}</p>
          </div>
          <button className="primary-btn btn-primary-action" type="button" onClick={() => setShowModal(true)}>
            {t("businesses.new")}
          </button>
        </section>

        <section className="section-card">
          <div className="search-row">
            <input
              className="input"
              placeholder={t("businesses.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {loading && <p style={{ color: "var(--muted)", textAlign: "center" }}>{t("businesses.loading")}</p>}
        {error && <p className="message-error">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>{t("businesses.empty")}</p>
        )}

        {!loading && (
          <>
            <section className="customer-grid">
              {filtered.slice(0, visibleCount).map((business) => (
                <BusinessCard 
                  key={business.businessID} 
                  business={business} 
                  onDeleteRequest={setDeletingBusiness}
                  onUpdated={(updated) => setBusinesses((prev) => prev.map((b) => b.businessID === updated.businessID ? updated : b))}
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
