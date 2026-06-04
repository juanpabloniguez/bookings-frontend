"use client";

import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

type CurrentUser = {
  name?: string;
  lastName?: string;
  email?: string;
};

function computeInitials(user: CurrentUser | null): string {
  const firstName = (user?.name ?? "").trim();
  const lastName = (user?.lastName ?? "").trim();

  const firstParts = firstName.split(/\s+/).filter(Boolean);
  const lastParts = lastName.split(/\s+/).filter(Boolean);

  const firstInitial = (firstParts[0]?.[0] ?? "").toUpperCase();

  let secondInitial = (lastParts[0]?.[0] ?? "").toUpperCase();

  if (!secondInitial) {
    secondInitial = (firstParts[1]?.[0] ?? "").toUpperCase();
  }

  if (!secondInitial) {
    secondInitial = (firstParts[0]?.[1] ?? "").toUpperCase();
  }

  const result = `${firstInitial}${secondInitial}`.trim();

  return (result.length >= 2
    ? result.slice(0, 2)
    : (result + "??").slice(0, 2));
}

export default function Header() {
  const { t } = useLanguage();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);

    localStorage.clear();
    sessionStorage.clear();

    window.location.replace("/login");
  };

  const handleViewProfile = () => {
    setIsMenuOpen(false);
    router.push("/profile");
  };

  // Cerrar menú al clickear afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Obtener usuario
  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");

      if (!raw) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser(JSON.parse(raw));
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const avatarText = computeInitials(currentUser);

  const avatarTitle = currentUser?.name
    ? `${currentUser.name}${currentUser.lastName ? ` ${currentUser.lastName}` : ""
    }`
    : t("header.profile_menu");

  return (
    <header className="admin-header">
      <div>
        <h1 className="admin-header__title">
          {t("app.title")}
        </h1>

        <p className="admin-header__subtitle">
          {t("app.subtitle")}
        </p>
      </div>

      <div className="admin-header__actions">
        <LanguageSwitcher />
        <ThemeToggle />

        <div
          className="profile-menu-container"
          ref={menuRef}
        >
          <div
            className="admin-avatar"
            onClick={toggleMenu}
            title={avatarTitle}
            role="button"
            tabIndex={0}
          >
            {avatarText}
          </div>

          {isMenuOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-info">
                <div className="dropdown-avatar">
                  {avatarText}
                </div>

                <div className="dropdown-user-details">
                  <span className="dropdown-user-name">
                    {avatarTitle}
                  </span>

                  <span className="dropdown-user-email">
                    {currentUser?.email ?? ""}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item"
                onClick={handleViewProfile}
              >
                <i className="bi bi-person"></i>

                {t("header.view_profile")}
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>

                {t("header.logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-menu-container {
          position: relative;
        }

        .admin-avatar {
          cursor: pointer;
          user-select: none;
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 14px);
          right: 0;

          width: 260px;
          padding: 6px;

          z-index: 100;

          border-radius: 16px;

          background: rgba(255, 255, 255, 0.8);

          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);

          border: 1px solid rgba(255, 255, 255, 0.35);

          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04);

          animation: dropdownIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        :global(html[data-theme="dark"]) .profile-dropdown {
          background: rgba(30, 41, 59, 0.78);

          border: 1px solid rgba(255, 255, 255, 0.08);

          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.35),
            0 2px 8px rgba(0, 0, 0, 0.2);
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-user-info {
          display: flex;
          align-items: center;
          gap: 12px;

          padding: 12px 10px;

          border-radius: 12px;
        }

        .dropdown-avatar {
          width: 36px;
          height: 36px;

          border-radius: 50%;

          background: linear-gradient(
            135deg,
            var(--primary),
            var(--accent)
          );

          color: white;

          display: grid;
          place-items: center;

          font-size: 13px;
          font-weight: 700;

          flex-shrink: 0;
        }

        .dropdown-user-details {
          display: flex;
          flex-direction: column;

          gap: 2px;

          min-width: 0;
        }

        .dropdown-user-name {
          font-size: 13.5px;
          font-weight: 600;

          color: var(--text);

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-user-email {
          font-size: 12px;

          color: var(--muted);

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-divider {
          height: 1px;

          margin: 4px 10px;

          background: rgba(0, 0, 0, 0.06);
        }

        :global(html[data-theme="dark"]) .dropdown-divider {
          background: rgba(255, 255, 255, 0.06);
        }

        .dropdown-item {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 10px 12px;

          border: none;
          border-radius: 10px;

          background: transparent;

          color: var(--text);

          font-size: 13.5px;
          font-weight: 500;

          cursor: pointer;

          text-align: left;

          transition:
            background 0.18s ease,
            transform 0.18s ease,
            color 0.18s ease;
        }

        .dropdown-item:hover {
          background: rgba(0, 0, 0, 0.05);

          transform: translateX(2px);
        }

        :global(html[data-theme="dark"]) .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .dropdown-item:active {
          transform: scale(0.98);
        }

        .dropdown-item i {
          width: 20px;

          font-size: 16px;

          color: var(--muted);

          text-align: center;
        }

        .dropdown-item.logout {
          color: #dc2626;
        }

        .dropdown-item.logout i {
          color: #dc2626;
        }

        .dropdown-item.logout:hover {
          background: rgba(220, 38, 38, 0.08);

          color: #dc2626;
        }

        :global(html[data-theme="dark"])
          .dropdown-item.logout:hover {
          background: rgba(220, 38, 38, 0.12);

          color: #ef4444;
        }
      `}</style>
    </header>
  );
}