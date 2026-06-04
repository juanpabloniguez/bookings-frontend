"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface UserProfile {
  name: string;
  lastName: string;
  business?: string;
  email: string;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Fallback fallback data if none exists
      setUser({
        name: "Administrador",
        lastName: "Sistema",
        business: "",
        email: "admin@admin.com",
      });
    }
  }, []);

  const handleLogout = () => {
    // Limpia TODOS los datos de sesión/caché para evitar acceso no autorizado
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  if (!user) return null;

  const isAdmin = user.email?.toLowerCase().endsWith("@admin.com");
  const roleBadge = isAdmin ? t("profile.role_admin") : t("profile.role_business");
  const roleDetail = isAdmin ? t("profile.role_admin_detail") : t("profile.role_business_detail");

  return (
    <div className="page-stack">
      <div className="page-hero">
        <div>
          <h2>{t("profile.title")}</h2>
          <p>{t("profile.subtitle")}</p>
        </div>
      </div>

      <div className="surface-card profile-card">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user.name.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div className="profile-main-info">
            <h3>{user.name} {user.lastName}</h3>
            <span className={`badge ${isAdmin ? 'badge--confirmed' : 'badge--paid'}`}>{roleBadge}</span>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="detail-item">
            <label>{t("profile.full_name")}</label>
            <p>{user.name} {user.lastName}</p>
          </div>
          <div className="detail-item">
            <label>{t("profile.email")}</label>
            <p>{user.email}</p>
          </div>
          <div className="detail-item">
            <label>{t("profile.birth_date")}</label>
            <p>{user.business || "—"}</p>
          </div>
          <div className="detail-item">
            <label>{t("profile.user_role")}</label>
            <p>{roleDetail}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button className="danger-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            {t("header.logout")}
          </button>
        </div>
      </div>

      <style jsx>{`
        .profile-card {
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid var(--border);
        }
        .profile-avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          display: grid;
          place-items: center;
          font-size: 36px;
          font-weight: 800;
          box-shadow: var(--shadow-md);
        }
        .profile-main-info h3 {
          font-size: 28px;
          margin: 0 0 8px;
          letter-spacing: -0.03em;
        }
        .profile-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-bottom: 40px;
        }
        .detail-item label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .detail-item p {
          font-size: 18px;
          font-weight: 500;
          margin: 0;
          color: var(--text);
        }
        .profile-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 32px;
          border-top: 1px solid var(--border);
        }
        .danger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 600px) {
          .profile-details-grid {
            grid-template-columns: 1fr;
          }
          .profile-header {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
