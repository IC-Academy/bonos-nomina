"use client";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { isDemo } from "../../config/env";
import { money } from "../../domain/format";
import { statusTone } from "../../domain/movements";
import type { BonusStatus, Movement } from "../../domain/types";

export function Head({ title, text }: { title: string; text: string }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {isDemo && <span className="demo">PROTOTIPO UX · DATOS DEMO</span>}
    </div>
  );
}

export function Kpi({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <article className="kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </article>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function Step({ text, ok, warn }: { text: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className={"step " + (ok ? "ok" : warn ? "warn" : "")}>
      <span></span>
      {text}
    </div>
  );
}

export function Status({ s }: { s: BonusStatus }) {
  return <span className={"status " + statusTone(s)}>{s}</span>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Check({ text, ok, warn }: { text: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className={"check " + (ok ? "ok" : warn ? "warn" : "")}>
      {ok ? <CheckCircle2 /> : <AlertTriangle />}
      <span>{text}</span>
    </div>
  );
}

export function BonusTable({ data, open }: { data: Movement[]; open: (m: Movement) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Bono</th>
            <th>Cliente / instalación</th>
            <th>Solicitado</th>
            <th>Respaldo</th>
            <th>Resultado</th>
            <th aria-label="Acciones"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.id}>
              <td>
                <b>{m.employeeName}</b>
                <small>{m.employeeId}</small>
              </td>
              <td>{m.bonus}</td>
              <td>
                {m.client}
                <small>{m.site}</small>
              </td>
              <td>{money(m.requested)}</td>
              <td>{m.hasSupport ? "Sí" : "No"}</td>
              <td>
                <Status s={m.status} />
              </td>
              <td>
                <button className="mini" onClick={() => open(m)}>
                  Revisar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
