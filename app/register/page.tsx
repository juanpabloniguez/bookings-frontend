"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = "http://localhost:3000";

const PLANS = [
  { id: "mensual", name: "Plan Mensual", monthlyEquivalent: "14,99€/mes", finalPrice: "14,99€", billingText: "Cobro mensual", popular: false },
  { id: "trimestral", name: "Plan Trimestral", monthlyEquivalent: "12,99€/mes", finalPrice: "38,97€", billingText: "Cobro cada 3 meses", popular: false },
  { id: "anual", name: "Plan Anual", monthlyEquivalent: "9,99€/mes", finalPrice: "119,88€", billingText: "Cobro cada 12 meses", popular: true }
];

const EMAIL_RESTRICTED_TOKEN = "@admin";
const BUSINESS_RESTRICTED_TOKEN = "admin";
const EMAIL_RESTRICTED_MESSAGE = "No se permite usar '@admin' en el correo electrónico.";
const BUSINESS_RESTRICTED_MESSAGE = "No se permite usar 'admin' en el nombre del negocio.";

function getRestrictedInputError(email: string, businessName: string): string {
  if (email.toLowerCase().includes(EMAIL_RESTRICTED_TOKEN)) {
    return EMAIL_RESTRICTED_MESSAGE;
  }

  if (businessName.toLowerCase().includes(BUSINESS_RESTRICTED_TOKEN)) {
    return BUSINESS_RESTRICTED_MESSAGE;
  }

  return "";
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    businessName: "",
    email: "",
    password: "",
  });

  const [selectedPlan, setSelectedPlan] = useState("");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    cardExpiry: "",
    cardCvv: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const nextFormData = { ...formData, [id]: value };

    setFormData(nextFormData);

    const restrictedError = getRestrictedInputError(nextFormData.email, nextFormData.businessName);
    if (restrictedError) {
      setError(restrictedError);
      return;
    }

    setError((prev) => (prev === EMAIL_RESTRICTED_MESSAGE || prev === BUSINESS_RESTRICTED_MESSAGE ? "" : prev));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { id, value } = e.target;
    if (id === "cardNumber") {
      value = value.replace(/\D/g, "").slice(0, 16);
      value = value.match(/.{1,4}/g)?.join(" ") || value;
    } else if (id === "cardExpiry") {
      value = value.replace(/\D/g, "").slice(0, 4);
      if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }
    } else if (id === "cardCvv") {
      value = value.replace(/\D/g, "").slice(0, 3);
    }
    setCardData({ ...cardData, [id]: value });
  };

  // Form is valid only when all personal details, business name, a plan, and card details are filled in
  const isFormValid =
    formData.name.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.businessName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    selectedPlan !== "" &&
    cardData.cardNumber.trim() !== "" &&
    cardData.cardHolder.trim() !== "" &&
    cardData.cardExpiry.trim() !== "" &&
    cardData.cardCvv.trim() !== "" &&
    getRestrictedInputError(formData.email, formData.businessName) === "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Por favor, rellena todos los datos personales, selecciona un plan y completa el pago.");
      return;
    }

    const restrictedError = getRestrictedInputError(formData.email, formData.businessName);
    if (restrictedError) {
      setError(restrictedError);
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          lastName: formData.lastName,
          business: formData.businessName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Error al crear la cuenta.");
        return;
      }

      // Save plan info in local storage temporarily to show in profile page if needed
      localStorage.setItem("registeredPlan", selectedPlan);

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="surface-card auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Regístrate para empezar a gestionar tu negocio</p>
        </div>

        {success ? (
          <div className="success-message">
            <i className="bi bi-check-circle-fill"></i>
            <p>¡Cuenta creada con éxito! Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {/* 1. Datos Personales */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nombre</label>
                <input id="name" type="text" className="input" placeholder="Tu nombre" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Apellidos</label>
                <input id="lastName" type="text" className="input" placeholder="Tus apellidos" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            {/* 2. Nombre del Negocio */}
            <div className="form-group">
              <label htmlFor="businessName">Nombre del Negocio</label>
              <div className="input-wrapper">
                <i className="bi bi-shop"></i>
                <input id="businessName" type="text" className="input" placeholder="Ej. Peluquería Nova" value={formData.businessName} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo Electrónico (No se permite @admin)</label>
              <div className="input-wrapper">
                <i className="bi bi-envelope"></i>
                <input id="email" type="email" className="input" placeholder="usuario@correo.com" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password">Contraseña (min. 8 caracteres)</label>
                <button
                  type="button"
                  className="password-toggle-text-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  <span>{showPassword ? "Ocultar" : "Mostrar"}</span>
                </button>
              </div>
              <div className="input-wrapper">
                <i className="bi bi-lock"></i>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 3. Selección de Plan */}
            <div className="plans-section">
              <p className="plans-title">Elige tu Plan de Suscripción</p>
              <div className="plans-grid">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan === plan.id ? "selected" : ""} ${plan.popular ? "popular-plan" : ""}`}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{ position: "relative" }}
                  >
                    {plan.popular && (
                      <span className="popular-badge">¡Más Recomendado!</span>
                    )}
                    <p className="plan-name">{plan.name}</p>
                    <p className="plan-monthly-equivalent">{plan.monthlyEquivalent}</p>
                    <p className="plan-final-price">{plan.finalPrice}</p>
                    <p className="plan-billing-text">{plan.billingText}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Sección de Pago con Tarjeta */}
            <div className="payment-section">
              <p className="payment-title">Método de Pago (Suscripción mensual)</p>

              <div className="form-group">
                <label htmlFor="cardHolder">Titular de la Tarjeta</label>
                <div className="input-wrapper">
                  <i className="bi bi-person-fill"></i>
                  <input
                    id="cardHolder"
                    type="text"
                    className="input"
                    placeholder="Nombre completo"
                    value={cardData.cardHolder}
                    onChange={handleCardChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cardNumber">Número de Tarjeta</label>
                <div className="input-wrapper">
                  <i className="bi bi-credit-card-2-front"></i>
                  <input
                    id="cardNumber"
                    type="text"
                    className="input"
                    placeholder="4500 1234 5678 9012"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    required
                  />
                </div>
              </div>

              <div className="card-row">
                <div className="form-group">
                  <label htmlFor="cardExpiry">Vencimiento</label>
                  <input
                    id="cardExpiry"
                    type="text"
                    className="input"
                    placeholder="MM/YY"
                    value={cardData.cardExpiry}
                    onChange={handleCardChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cardCvv">CVV</label>
                  <input
                    id="cardCvv"
                    type="password"
                    className="input"
                    placeholder="•••"
                    value={cardData.cardCvv}
                    onChange={handleCardChange}
                    required
                  />
                </div>
              </div>
            </div>

            {error && <p className="message-error" style={{ marginTop: 8 }}>{error}</p>}

            <button
              type="submit"
              className="primary-btn auth-submit"
              disabled={loading || !isFormValid}
              style={{
                opacity: (loading || !isFormValid) ? 0.5 : 1,
                cursor: (loading || !isFormValid) ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creando cuenta..." : "Registrarse y Pagar"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>¿Ya tienes una cuenta? <Link href="/login" className="panel-subtle-link">Inicia sesión</Link></p>
        </div>
      </div>

      <style jsx>{`
        .auth-container { display: grid; place-items: center; min-height: 100vh; padding: 40px 20px; }
        .auth-card { width: min(100%, 580px); padding: 40px; animation: slideIn 0.5s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-title { font-size: 32px; font-weight: 800; letter-spacing: -0.04em; margin: 0; }
        .auth-subtitle { color: var(--muted); margin-top: 8px; font-size: 15px; }
        .auth-form { display: flex; flex-direction: column; gap: 18px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 13px; font-weight: 600; color: var(--text); }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-wrapper i { position: absolute; left: 14px; color: var(--muted); font-size: 18px; }
        .input-wrapper .input { padding-left: 44px; }
        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .password-toggle-text-btn {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s ease, transform 0.1s ease;
        }
        .password-toggle-text-btn:hover {
          color: var(--text);
        }
        .password-toggle-text-btn:active {
          transform: scale(0.96);
        }
        .plans-section {
          border-top: 1px solid var(--border);
          padding-top: 20px;
          margin-top: 10px;
        }
        .plans-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 12px;
          color: var(--text);
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .plan-card {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: 14px;
          padding: 18px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .plan-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .plan-card.selected {
          border-color: var(--accent);
          background: var(--primary-soft);
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.15);
        }
        .plan-card.popular-plan {
          border-color: var(--accent-light, rgba(99, 102, 241, 0.4));
        }
        .plan-card.popular-plan.selected {
          border-color: var(--accent);
        }
        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, var(--accent), #a259ff);
          color: white;
          font-size: 8px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 8px rgba(108, 99, 255, 0.4);
          white-space: nowrap;
        }
        .plan-name {
          font-weight: 700;
          font-size: 13px;
          margin: 0 0 4px;
          color: var(--text);
        }
        .plan-monthly-equivalent {
          font-size: 14px;
          color: var(--text);
          margin: 2px 0 6px;
          font-weight: 700;
          opacity: 0.9;
        }
        .plan-final-price {
          font-size: 28px;
          font-weight: 950;
          color: var(--accent);
          margin: 4px 0 8px;
          letter-spacing: -0.04em;
          text-shadow: 0 0 12px rgba(99, 102, 241, 0.15);
        }
        .plan-billing-text {
          font-size: 9px;
          color: var(--muted);
          margin: 0;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .payment-section {
          border-top: 1px solid var(--border);
          padding-top: 20px;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .payment-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 4px;
          color: var(--text);
        }
        .card-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .auth-submit { width: 100%; padding: 14px; font-size: 16px; margin-top: 8px; transition: all 0.2s ease; }
        .auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--muted); }
        .success-message { text-align: center; padding: 20px; background: var(--success-bg); color: var(--success-text); border-radius: 14px; margin-bottom: 20px; }
        .success-message i { font-size: 40px; display: block; margin-bottom: 12px; }
        @media (max-width: 600px) {
          .form-row { grid-template-columns: 1fr; }
          .plans-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
