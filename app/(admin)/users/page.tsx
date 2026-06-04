"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const API = "http://localhost:3000";

interface User {
  id: number;
  name: string;
  lastName: string;
  birthDate?: string;
  email: string;
  createdAt: string;
}

function DeleteModal({
  user,
  onClose,
  onDeleted,
}: {
  user: User;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`${API}/users/${user.id}`, { method: "DELETE" });
      onDeleted(user.id);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">Eliminar usuario</p>
        <p className="modal-text">
          ¿Estás seguro de que quieres eliminar a{" "}
          <strong>
            {user.name} {user.lastName}
          </strong>
          ? Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="danger-btn" onClick={handleDelete} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatBusinessOrDate(val: string) {
  if (!val) return "—";
  const timestamp = Date.parse(val);
  if (!isNaN(timestamp) && val.includes("-") && val.length === 10) {
    return new Date(val).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return val;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string, lastName: string) {
  return `${name[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = [
  "#6C63FF", "#FF6584", "#43B89C", "#F5A623", "#4A90E2",
  "#E97C4A", "#A259FF", "#00BFA5",
];
function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${API}/users`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setUsers)
      .catch(() => setError("No se pudieron cargar los usuarios. Comprueba que el backend esté activo."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    `${u.name} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {toDelete && (
        <DeleteModal
          user={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
        />
      )}

      <div className="page-stack">
        {/* Header */}
        <section className="page-hero">
          <div>
            <h2>Usuarios Administradores</h2>
            <p>Gestiona las cuentas de acceso al panel de administración</p>
          </div>
          <div className="hero-badge">
            <i className="bi bi-people-fill"></i>
            <span>{users.length} usuario{users.length !== 1 ? "s" : ""}</span>
          </div>
        </section>

        {/* Search */}
        <section className="section-card">
          <div className="search-row">
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="input search-input"
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* States */}
        {loading && (
          <div className="state-box">
            <div className="spinner"></div>
            <p>Cargando usuarios...</p>
          </div>
        )}
        {error && <p className="message-error">{error}</p>}

        {/* Table */}
        {!loading && !error && (
          <section className="section-card table-section">
            {filtered.length === 0 ? (
              <div className="state-box">
                <i className="bi bi-person-x" style={{ fontSize: 40, color: "var(--muted)" }}></i>
                <p style={{ color: "var(--muted)" }}>
                  {search ? t("users.no_results") : t("users.empty")}
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Negocio / Fecha Nac.</th>
                      <th>Registrado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div
                              className="user-avatar"
                              style={{ background: avatarColor(user.id) }}
                            >
                              {getInitials(user.name, user.lastName)}
                            </div>
                            <div>
                              <p className="user-name">
                                {user.name} {user.lastName}
                              </p>
                              <p className="user-id">ID #{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="email-badge">
                            <i className="bi bi-envelope"></i> {user.email}
                          </span>
                        </td>
                        <td className="muted-cell">{user.birthDate ? formatBusinessOrDate(user.birthDate) : "—"}</td>
                        <td className="muted-cell">{formatDate(user.createdAt)}</td>
                        <td>
                          <button
                            className="icon-btn danger"
                            title="Eliminar usuario"
                            onClick={() => setToDelete(user)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      <style jsx>{`
        .hero-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: #fff;
          padding: 10px 18px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 15px;
        }
        .hero-badge i { font-size: 18px; }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 16px;
        }
        .search-input { padding-left: 40px; width: 100%; }

        .table-section { padding: 0; overflow: hidden; }
        .table-wrapper { overflow-x: auto; }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .users-table thead tr {
          background: var(--surface-raised, rgba(255,255,255,0.04));
        }
        .users-table th {
          padding: 14px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          white-space: nowrap;
        }
        .users-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.05));
          vertical-align: middle;
        }
        .users-table tbody tr {
          transition: background 0.15s;
        }
        .users-table tbody tr:hover {
          background: var(--surface-raised, rgba(255,255,255,0.03));
        }
        .users-table tbody tr:last-child td { border-bottom: none; }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .user-name {
          font-weight: 600;
          color: var(--text);
          margin: 0;
          line-height: 1.3;
        }
        .user-id {
          font-size: 12px;
          color: var(--muted);
          margin: 0;
        }

        .email-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(108,99,255,0.1);
          color: var(--accent, #6C63FF);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
        }
        .email-badge i { font-size: 12px; }

        .muted-cell { color: var(--muted); font-size: 13px; }

        .icon-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          font-size: 16px;
          color: var(--muted);
        }
        .icon-btn.danger:hover {
          background: rgba(239,68,68,0.12);
          color: #ef4444;
        }

        .state-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 20px;
          color: var(--muted);
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border, rgba(255,255,255,0.1));
          border-top-color: var(--accent, #6C63FF);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .danger-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: #ef4444;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .danger-btn:hover { opacity: 0.85; }
        .danger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  );
}
