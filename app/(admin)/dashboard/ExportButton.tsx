// ExportButton.tsx
"use client";

import { useLanguage } from "@/context/LanguageContext";

type DashboardBookingStatus = "pending" | "confirmed" | "paid";

type DashboardBooking = {
    time: string;
    client: string;
    business: string;
    service: string;
    status: DashboardBookingStatus;
};

type KpiData = {
    title: string;
    value: string;
    subtitle: string;
};

type ExportButtonProps = {
    bookings: DashboardBooking[];
    kpis: KpiData[];
};

export function ExportButton({ bookings, kpis }: ExportButtonProps) {
    const { t, lang } = useLanguage();

    function exportar() {
        const statusLabel = (status: DashboardBookingStatus) => {
            if (status === "pending") return t("export.status.pending");
            if (status === "confirmed") return t("export.status.confirmed");
            return t("export.status.paid");
        };

        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) return;

        const html = `
      <!DOCTYPE html>
      <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>Dashboard Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 13px; margin-bottom: 32px; }
          .date { color: #888; font-size: 12px; margin-bottom: 24px; }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 32px;
          }
          .kpi-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
          }
          .kpi-card__label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
          .kpi-card__value { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
          .kpi-card__meta { font-size: 12px; color: #666; }

          h2 { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 8px 10px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 12px; }
          td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
          .badge--pending  { background: #fef3c7; color: #92400e; }
          .badge--confirmed { background: #dbeafe; color: #1e40af; }
          .badge--paid     { background: #d1fae5; color: #065f46; }

          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${t("export.title")}</h1>
        <p class="subtitle">${t("export.subtitle")}</p>
        <p class="date">${t("export.generated")} ${new Date().toLocaleString(lang === "es" ? "es-ES" : "en-US")}</p>

        <div class="kpi-grid">
          ${kpis
                .map(
                    (k) => `
            <div class="kpi-card">
              <p class="kpi-card__label">${k.title}</p>
              <h3 class="kpi-card__value">${k.value}</h3>
              <p class="kpi-card__meta">${k.subtitle}</p>
            </div>`
                )
                .join("")}
        </div>

        <h2>${t("export.bookings_title")}</h2>
        <table>
          <thead>
            <tr>
              <th>${t("export.time")}</th>
              <th>${t("export.customer")}</th>
              <th>${t("export.business")}</th>
              <th>${t("export.service")}</th>
              <th>${t("export.status")}</th>
            </tr>
          </thead>
          <tbody>
            ${bookings
                .map(
                    (b) => `
              <tr>
                <td><strong>${b.time}</strong></td>
                <td>${b.client}</td>
                <td>${b.business}</td>
                <td>${b.service}</td>
                <td><span class="badge badge--${b.status}">${statusLabel(b.status)}</span></td>
              </tr>`
                )
                .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    return (
        <button className="primary-btn btn-primary-action" type="button" onClick={exportar}>
            {t("dashboard.exportReport")}
        </button>
    );
}