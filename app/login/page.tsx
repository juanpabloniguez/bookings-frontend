"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = "http://localhost:3000";

function capitalizeWord(value: string) {
  const v = value.trim();
  if (!v) return "";
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

function deriveMockNameFromEmail(email: string) {
  const local = (email.split("@")[0] ?? "").trim();
  const parts = local.split(/[._\-\s]+/).filter(Boolean);

  const name = capitalizeWord(parts[0] ?? "Admin");
  const lastName = capitalizeWord(parts[1] ?? "User");
  return { name, lastName };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, rellena todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Credenciales inválidas. El correo debe tener un formato válido y la contraseña de mín. 8 caracteres.");
        setLoading(false);
        return;
      }

      const user = await res.json();
      localStorage.setItem("currentUser", JSON.stringify(user));
      router.push("/dashboard");
    } catch {
      if (email.endsWith("@admin.com") && password.length >= 8) {
        // Guardar sesión mock consistente con el backend
        const derived = deriveMockNameFromEmail(email);
        const mockUser = { email, ...derived, role: "admin" };
        localStorage.setItem("currentUser", JSON.stringify(mockUser));
        router.push("/dashboard");
      } else {
        setError("No se pudo conectar con el servidor.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="surface-card auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Bienvenido</h1>
          <p className="auth-subtitle">Inicia sesión para gestionar tus reservas</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <i className="bi bi-envelope"></i>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="ejemplo@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password">Contraseña</label>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="message-error">{error}</p>}

          <button type="submit" className="primary-btn auth-submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes una cuenta? <Link href="/register" className="panel-subtle-link">Crear cuenta</Link></p>
        </div>
      </div>

      <style jsx>{`
        .auth-container { display: grid; place-items: center; min-height: 100vh; padding: 20px; }
        .auth-card { width: min(100%, 420px); padding: 40px; animation: slideIn 0.5s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-title { font-size: 32px; font-weight: 800; letter-spacing: -0.04em; margin: 0; }
        .auth-subtitle { color: var(--muted); margin-top: 8px; font-size: 15px; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 14px; font-weight: 600; color: var(--text); }
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
        .auth-submit { width: 100%; padding: 14px; font-size: 16px; margin-top: 8px; }
        .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--muted); }
      `}</style>
    </div>
  );
}
